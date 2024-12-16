import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { ClubUpdatedEvent } from '../events/club-updated.event';

@EventsHandler(ClubUpdatedEvent)
export class ClubUpdatedHandler implements IEventHandler<ClubUpdatedEvent> {
  private readonly logger = new Logger(ClubUpdatedHandler.name);

  handle(event: ClubUpdatedEvent) {
    this.logger.log(`Club ${event.clubId} updated`);
  }
}
