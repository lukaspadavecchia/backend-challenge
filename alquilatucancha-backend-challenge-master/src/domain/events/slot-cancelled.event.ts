import { Slot } from '../model/slot';

export class SlotAvailableEvent {
  constructor(
    public clubId: number,
    public courtId: number,
    public slot: Slot,
  ) {}
}
