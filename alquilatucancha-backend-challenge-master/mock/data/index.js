/* eslint-disable @typescript-eslint/no-var-requires */
class Data {
  booked = [];

  constructor(availability) {
    this.availability = availability;
  }

  getRandomClub() {
    const clubs = getRandomItem(Object.values(this.availability));
    return getRandomItem(clubs);
  }

  getRandomCourt() {
    const club = this.getRandomClub();
    const court = getRandomItem(club.courts);
    return { club, court };
  }

  getRandomSlot() {
    const { club, court } = this.getRandomCourt();
    const slot = getRandomItem(court.available);
    return { club, court, slot };
  }

  book(slot) {
    slot.booked = true;
  }

  cancel(slot) {
    slot.booked = false;
  }

  search({ placeId, date, clubId, courtId }) {
    let clubs = this.availability[placeId] || [];
    if (clubId) {
      clubs = clubs.filter((club) => club.id === clubId);
    }
    return clubs.map((club) => {
      let courts = club.courts;
      if (courtId) {
        courts = courts.filter((court) => court.id === courtId);
      }
      return {
        ...club,
        courts: courts.map((court) => ({
          ...court,
          available: court.available
            .filter((slot) => !slot.booked)
            .map((slot) => ({
              ...slot,
              datetime: slot.datetime.replace('2022-08-20', date),
            })),
        })),
      };
    });
  }

  getZones() {
    const zones = [];
    for (const place in this.availability) {
      zones.push(this.availability[place][0].zone);
    }
    return zones;
  }

  getClubs(placeId) {
    return this.availability[placeId] || [];
  }

  getClub(clubId) {
    for (const place in this.availability) {
      const club = this.availability[place].find((club) => club.id === clubId);
      if (club) {
        return club;
      }
    }
  }

  getCourts(clubId) {
    const club = this.getClub(clubId);
    if (!club) {
      return [];
    }
    return club.courts;
  }

  getCourt(clubId, courtId) {
    const courts = this.getCourts(clubId);
    return courts.find((court) => court.id === courtId);
  }

  getSlots(clubId, courtId, date) {
    const court = this.getCourt(clubId, courtId);
    if (!court) {
      return [];
    }
    return court.available
      .filter((slot) => !slot.booked)
      .map((slot) => ({
        ...slot,
        booked: undefined,
        datetime: slot.datetime.replace('2022-08-20', date),
      }));
  }
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

const data = new Data({
  ChIJoYUAHyvmopUR4xJzVPBE_Lw: require('./ChIJoYUAHyvmopUR4xJzVPBE_Lw.json')
    .data,
  ChIJW9fXNZNTtpURV6VYAumGQOw: require('./ChIJW9fXNZNTtpURV6VYAumGQOw.json')
    .data,
});

module.exports = data;
