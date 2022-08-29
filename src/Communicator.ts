import {OurMessage} from "./OurMessage"
export interface Communicator {
  askServerForNewBrowserView: (message: OurMessage) => Promise<void>;
  onMessage: (callback: (message:OurMessage) => void) => Promise<void>;
}
