type UpdatableFields =
  | 'attributes'
  | 'openhours'
  | 'logo_url'
  | 'background_url';
export class ClubUpdatedEvent {
  constructor(public clubId: number, public fields: UpdatableFields[]) {}
}
