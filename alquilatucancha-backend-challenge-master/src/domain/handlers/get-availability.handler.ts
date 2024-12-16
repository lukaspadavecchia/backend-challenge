import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../commands/get-availaiblity.query';
import {
  ALQUILA_TU_CANCHA_CLIENT,
  AlquilaTuCanchaClient,
} from '../ports/aquila-tu-cancha.client';

@QueryHandler(GetAvailabilityQuery)
export class GetAvailabilityHandler
  implements IQueryHandler<GetAvailabilityQuery>
{
  constructor(
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private alquilaTuCanchaClient: AlquilaTuCanchaClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async execute(query: GetAvailabilityQuery): Promise<ClubWithAvailability[]> {
    const cacheKey = `availability:${query.placeId}:${query.date.toISOString().split('T')[0]}`;
    const cachedResult = await this.cacheManager.get<ClubWithAvailability[]>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const clubs = await this.alquilaTuCanchaClient.getClubs(query.placeId);
    const clubsWithAvailability = await Promise.all(
      clubs.map(async (club) => {
        const courts = await this.alquilaTuCanchaClient.getCourts(club.id);
        const courtsWithAvailability = await Promise.all(
          courts.map(async (court) => {
            const slots = await this.alquilaTuCanchaClient.getAvailableSlots(
              club.id,
              court.id,
              query.date
            );
            return {
              ...court,
              available: slots,
            };
          })
        );
        return {
          ...club,
          courts: courtsWithAvailability,
        };
      })
    );

    await this.cacheManager.set(cacheKey, clubsWithAvailability, 300);
    return clubsWithAvailability;
  }
}
