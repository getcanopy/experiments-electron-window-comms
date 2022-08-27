import {OurMessage} from "./OurMessage";
export interface Communicator {
  message: (message: OurMessage) => Promise<void>;
  onMessage: (callback: (message:OurMessage) => void) => Promise<void>;
}
