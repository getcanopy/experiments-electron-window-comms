import {OurMessage} from "./OurMessage";
export interface Communicator {
  message: (OurMessage) => void;
  onMessage: (callback: (OurMessage, port?: MessagePort) => void) => void;
}