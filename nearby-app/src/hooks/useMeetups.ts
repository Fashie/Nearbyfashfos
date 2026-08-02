import { useState, useEffect } from 'react';
import { meetupService } from '../features/safeMeetups/services/meetupService';
import { Meetup } from '../types';

export function useMeetups(userId: string | undefined) {
  const [meetups, setMeetups] = useState<Meetup[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = meetupService.subscribeToUserMeetups(userId, (data) => {
      setMeetups(data);
    });
    return unsubscribe;
  }, [userId]);

  const schedule = async (meetup: Meetup) => {
    await meetupService.scheduleMeetup(meetup);
  };

  return {
    meetups,
    schedule
  };
}
