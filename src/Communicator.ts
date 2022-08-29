import {OurMessage} from "./OurMessage"
export interface Communicator {
  createChild({name, url}): Promise<MessagePort>
  onMessage: (callback: (message:OurMessage) => void) => Promise<void>;
}
