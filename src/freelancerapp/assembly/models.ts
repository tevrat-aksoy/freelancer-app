import { context, PersistentMap, PersistentVector, u128 } from "near-sdk-as";

import { AccountId } from "./utils";

// freelancers are users that able to apply for projectsc and get payments
@nearBindgen
export class Freelancer {
  id: AccountId;
  nick_name: string;
  hourlyRate: u128;
  freeToOffer: bool;

  constructor(
    _id: AccountId,
    _name: string,
    _hourlyRate: u128,
    _freeToOffer: bool
  ) {
    this.id = _id;
    this.nick_name = _name;
    this.hourlyRate = _hourlyRate;
    this.freeToOffer = _freeToOffer;
  }
}
// Employer are users that able to create projectsc and pay freelancers
@nearBindgen
export class Employer {
  id: AccountId;
  nick_name: string;
  projectsNo: PersistentVector<i32>;

  constructor(_id: AccountId, _name: string) {
    this.id = _id;
    this.nick_name = _name;
    this.projectsNo = new PersistentVector<i32>("ee");
  }
}

//project cerated by employers
@nearBindgen
export class Project {
  projectOwner: AccountId;
  name: string;
  price: u128;
  status: string;
  timeLimit: string;

  constructor(
    _projectOwner: AccountId,
    _name: string,
    _price: u128,
    _timeLimit: string
  ) {
    this.projectOwner = _projectOwner;
    this.name = _name;
    this.price = _price;
    this.status = "open";
    this.timeLimit = _timeLimit;
  }
  setStatus(_status: string): void {
    this.status = _status;
  }
}
