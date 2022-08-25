import {OurMessage} from "./OurMessage";
export interface Communicator {
  message: (OurMessage) => Promise<void>;
  onMessage: (callback: (OurMessage) => void) => Promise<void>;
}
