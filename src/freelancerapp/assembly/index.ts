import {
  Context,
  logging,
  storage,
  PersistentMap,
  PersistentVector,
  ContractPromiseBatch,
  u128,
} from "near-sdk-as";

import { Freelancer, Employer, Project } from "./models";
import { AccountId } from "./utils";

//freelancers store each freelancer model
let freelancers: PersistentVector<Freelancer> =
  new PersistentVector<Freelancer>("f");
//employers store each employer model
let employers: PersistentVector<Employer> = new PersistentVector<Employer>("e");
//projects store each project model
let projects: PersistentVector<Project> = new PersistentVector<Project>("p");

//projectApplyList: mapping that store each project and freelancer that applied for
let projectApplyList: PersistentMap<
  i32,
  PersistentVector<AccountId>
> = new PersistentMap<i32, PersistentVector<AccountId>>("pa");

//projectStatus: mapping that store each project and current status
let projectStatus: PersistentMap<i32, string> = new PersistentMap<i32, string>(
  "ps"
);
//assignedFreelancerProject: mapping that store each project and current freelancer that assigned for it

let assignedFreelancerProject: PersistentMap<
  AccountId,
  PersistentVector<i32>
> = new PersistentMap<AccountId, PersistentVector<i32>>("ad");

//finishedProjects: mapping that store each project and  freelancer that completed
let finishedProjects: PersistentMap<i32, AccountId> = new PersistentMap<
  i32,
  AccountId
>("fp");

//create new freelancer and add to freelancers vector
export function registerFreelancer(
  _name: string,
  _hourlyRate: u128,
  _freeToOffer: bool
): void {
  let userId = Context.sender;
  let newFreelancer = new Freelancer(userId, _name, _hourlyRate, _freeToOffer);

  freelancers.push(newFreelancer);
  let initAssignment: PersistentVector<i32> = new PersistentVector<i32>("ia");
  initAssignment.push(-1);
  assignedFreelancerProject.set(userId, initAssignment);
}

//create new employer and add to employers vector
export function registerEmployer(_name: string): void {
  let userId = Context.sender;
  let newEmployer = new Employer(userId, _name);

  employers.push(newEmployer);
}

//check if caller account is employer then create new project and add to projects vector
export function registerProject(
  _name: string,
  _price: u128,
  _timeLimit: string
): void {
  let userId = Context.sender;
  let newProject = new Project(userId, _name, _price, _timeLimit);
  projects.push(newProject);
  let projectNo: i32 = projects.length - 1;

  let empNo: i32 = getEmployerByAccountId(userId);
  assert(empNo != -1, "employer not registered");
  employers[empNo].projectsNo.push(projectNo);
  projectStatus.set(projectNo, "open");
}

// return all projects
export function getProjects(): Array<Project> {
  let projectList = new Array<Project>();

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    projectList.push(project);
  }
  return projectList;
}
// return all freelancers
export function getAllFreelancers(): Array<Freelancer> {
  let freelancerList = new Array<Freelancer>();

  for (let i = 0; i < freelancers.length; i++) {
    let singleFreelancer = freelancers[i];
    freelancerList.push(singleFreelancer);
  }
  return freelancerList;
}
// return freelancers vector index for account
export function getFreelancerByAccountId(account: AccountId): i32 {
  let freeId: i32 = -1;
  for (let i = 0; i < freelancers.length; i++) {
    if (account == freelancers[i].id) {
      freeId = i;
    }
  }
  return freeId;
}
// return employers vector index for account
export function getEmployerByAccountId(account: AccountId): i32 {
  let empId: i32 = -1;
  for (let i = 0; i < employers.length; i++) {
    if (account == employers[i].id) {
      empId = i;
    }
  }

  return empId;
}

// return project status for given project
export function getStatus(projectNo: i32): string {
  return projectStatus.get(projectNo)!;
}

// check if project is open and caller is registered as freelancer then apply  for project
export function applyForProject(projectNo: i32): void {
  let userId = Context.sender;

  assert(
    projectStatus.get(projectNo) == "open",
    "project not open for applying"
  );
  let freeNo: i32 = getFreelancerByAccountId(userId);
  assert(freeNo != -1, "freelancer not registered");

  let oldSubmits = projectApplyList.get(projectNo);
  let submit = new PersistentVector<AccountId>("su");
  if (oldSubmits != null) {
    oldSubmits.push(userId);
    projectApplyList.set(projectNo, oldSubmits);
  } else {
    submit.push(userId);
    projectApplyList.set(projectNo, submit);
  }
}

/*check :
          1)caller is project owner 
          2)freelancer is applied for this project 
          3)employer deposited enough money
  then accept and assign project for given freelancer acocunt 
 */
export function acceptFreelancer(
  projectNo: i32,
  freelancerId: AccountId
): void {
  let userId = Context.sender;
  assert(projects[projectNo].projectOwner == userId, "only owner can accept");
  let applyyingFreelancers = projectApplyList.get(projectNo);

  assert(applyyingFreelancers != null, "no freelancer apply");

  let foundId: bool = false;
  if (applyyingFreelancers != null) {
    for (let i = 0; i < applyyingFreelancers.length; i++) {
      if (applyyingFreelancers[i] == freelancerId) {
        foundId = true;
      }
    }
  }
  assert(foundId == true, "freelancer not applied for this project");
  assert(
    Context.attachedDeposit > u128.from(projects[projectNo].price),
    "Employer not deposited enough money"
  );
  projectStatus.set(projectNo, "pending");
  let oldAssignmens = assignedFreelancerProject.get(freelancerId)!;

  oldAssignmens.push(projectNo);

  assignedFreelancerProject.set(freelancerId, oldAssignmens);
}

// return assigned projects for freelancer
export function getAssignedProjects(accountId: AccountId): Array<i32> {
  let assignmetsList = new Array<i32>();
  let assignmets: PersistentVector<i32> = new PersistentVector<i32>("tee");
  for (let i = 0; i < assignmets.length; i++) {
    let assign = assignmets[i];
    assignmetsList.push(assign);
  }
  return assignmetsList;
}
/*check :
          1)projects assigned for this freelancer
          2)project status is pending 

  then submit and change project status for submit 
 */
export function submitCompleteProject(projectNo: i32): void {
  let userId = Context.sender;
  let freeNo: i32 = getFreelancerByAccountId(userId);
  let foundProject: bool = false;

  let assignments = assignedFreelancerProject.get(userId)!;

  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i] == projectNo) {
      foundProject = true;
    }
  }
  assert(foundProject == true, "project not assigned to this user");
  assert(
    projectStatus.get(projectNo) == "pending",
    "project submission closed"
  );

  projectStatus.set(projectNo, "submit");

  finishedProjects.set(projectNo, userId);
}

/*check :
          1)if caller is project owner 
          2)project status is submit 

  then finish the project and complte payment to freelancer
 */
export function finishProject(projectNo: i32): void {
  let userId = Context.sender;

  let empNo: i32 = getEmployerByAccountId(userId);
  assert(projects[projectNo].projectOwner == userId);
  assert(projectStatus.get(projectNo) == "submit");

  projectStatus.set(projectNo, "finish");

  let freelancerId: AccountId = finishedProjects.get(projectNo)!;

  ContractPromiseBatch.create(freelancerId).transfer(projects[projectNo].price);
}
