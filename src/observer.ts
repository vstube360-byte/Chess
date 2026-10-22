
import { Subject } from "./subject.js";

export interface Observer {

    update(subject: Subject): void;
}