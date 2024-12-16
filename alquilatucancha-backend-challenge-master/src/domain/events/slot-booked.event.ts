import { Slot } from '../model/slot';

export class SlotBookedEvent {
  constructor(
    public clubId: number,
    public courtId: number,
    public slot: Slot,
  ) {}
}
