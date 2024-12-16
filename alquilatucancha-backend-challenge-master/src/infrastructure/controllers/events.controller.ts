import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Cache } from 'cache-manager';
import { UseZodGuard } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { ClubUpdatedEvent } from '../../domain/events/club-updated.event';
import { CourtUpdatedEvent } from '../../domain/events/court-updated.event';
import { SlotBookedEvent } from '../../domain/events/slot-booked.event';
import { SlotAvailableEvent } from '../../domain/events/slot-cancelled.event';

const SlotSchema = z.object({
  price: z.number(),
  duration: z.number(),
  datetime: z.string(),
  start: z.string(),
  end: z.string(),
  _priority: z.number(),
});

export const ExternalEventSchema = z.union([
  z.object({
    type: z.enum(['booking_cancelled', 'booking_created']),
    clubId: z.number().int(),
    courtId: z.number().int(),
    slot: SlotSchema,
  }),
  z.object({
    type: z.literal('club_updated'),
    clubId: z.number().int(),
    fields: z.array(
      z.enum(['attributes', 'openhours', 'logo_url', 'background_url']),
    ),
  }),
  z.object({
    type: z.literal('court_updated'),
    clubId: z.number().int(),
    courtId: z.number().int(),
    fields: z.array(z.enum(['attributes', 'name'])),
  }),
]);

export type ExternalEventDTO = z.infer<typeof ExternalEventSchema>;

@Controller('events')
export class EventsController {
  constructor(
    private eventBus: EventBus,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post()
  @UseZodGuard('body', ExternalEventSchema)
  async receiveEvent(@Body() externalEvent: ExternalEventDTO) {
    switch (externalEvent.type) {
      case 'booking_created':
        await this.invalidateCache(externalEvent.clubId, externalEvent.courtId);
        this.eventBus.publish(
          new SlotBookedEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.slot,
          ),
        );
        break;
      case 'booking_cancelled':
        await this.invalidateCache(externalEvent.clubId, externalEvent.courtId);
        this.eventBus.publish(
          new SlotAvailableEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.slot,
          ),
        );
        break;
      case 'club_updated':
        await this.invalidateClubCache(externalEvent.clubId);
        this.eventBus.publish(
          new ClubUpdatedEvent(externalEvent.clubId, externalEvent.fields),
        );
        break;
      case 'court_updated':
        await this.invalidateCache(externalEvent.clubId, externalEvent.courtId);
        this.eventBus.publish(
          new CourtUpdatedEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.fields,
          ),
        );
        break;
    }
  }

  private async invalidateCache(clubId: number, courtId: number) {
    const keys = await this.cacheManager.store.keys(
      `slots:${clubId}:${courtId}:*`,
    );
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }

  private async invalidateClubCache(clubId: number) {
    const clubKeys = await this.cacheManager.store.keys(`clubs:*`);
    const courtKeys = await this.cacheManager.store.keys(`courts:${clubId}`);
    const slotKeys = await this.cacheManager.store.keys(`slots:${clubId}:*`);
    await Promise.all(
      [...clubKeys, ...courtKeys, ...slotKeys].map((key) =>
        this.cacheManager.del(key),
      ),
    );
  }
}
