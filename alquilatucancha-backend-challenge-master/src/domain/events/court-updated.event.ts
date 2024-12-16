type UpdatableFields = 'attributes' | 'name';

export class CourtUpdatedEvent {
  constructor(
    public clubId: number,
    public courtId: number,
    public fields: UpdatableFields[],
  ) {}
}
