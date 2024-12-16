import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import * as moment from 'moment';

import { Club } from '../../domain/model/club';
import { Court } from '../../domain/model/court';
import { Slot } from '../../domain/model/slot';
import { AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';

@Injectable()
export class HTTPAlquilaTuCanchaClient implements AlquilaTuCanchaClient {
  private base_url: string;
  constructor(
    private httpService: HttpService,
    config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.base_url = config.get<string>('ATC_BASE_URL', 'http://localhost:4000');
  }

  async getClubs(placeId: string): Promise<Club[]> {
    const cacheKey = `clubs:${placeId}`;
    const cachedClubs = await this.cacheManager.get<Club[]>(cacheKey);
    if (cachedClubs) {
      return cachedClubs;
    }

    const clubs = await this.httpService.axiosRef
      .get('clubs', {
        baseURL: this.base_url,
        params: { placeId },
      })
      .then((res) => res.data);

    await this.cacheManager.set(cacheKey, clubs, 3600);
    return clubs;
  }

  async getCourts(clubId: number): Promise<Court[]> {
    const cacheKey = `courts:${clubId}`;
    const cachedCourts = await this.cacheManager.get<Court[]>(cacheKey);
    if (cachedCourts) {
      return cachedCourts;
    }

    const courts = await this.httpService.axiosRef
      .get(`/clubs/${clubId}/courts`, {
        baseURL: this.base_url,
      })
      .then((res) => res.data);

    await this.cacheManager.set(cacheKey, courts, 3600);
    return courts;
  }

  async getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[]> {
    const cacheKey = `slots:${clubId}:${courtId}:${moment(date).format(
      'YYYY-MM-DD',
    )}`;
    const cachedSlots = await this.cacheManager.get<Slot[]>(cacheKey);
    if (cachedSlots) {
      return cachedSlots;
    }

    const slots = await this.httpService.axiosRef
      .get(`/clubs/${clubId}/courts/${courtId}/slots`, {
        baseURL: this.base_url,
        params: { date: moment(date).format('YYYY-MM-DD') },
      })
      .then((res) => res.data);

    await this.cacheManager.set(cacheKey, slots, 300);
    return slots;
  }
}
