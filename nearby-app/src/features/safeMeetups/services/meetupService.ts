import { db } from '../../../services/firebase';
import { Meetup, MeetupRating } from '../../../types';
import { collection, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';

export const meetupService = {
  scheduleMeetup: async (meetup: Meetup) => {
    const meetupRef = doc(db, 'meetups', meetup.meetupId);
    await setDoc(meetupRef, meetup, { merge: true });
  },

  rateMeetup: async (rating: MeetupRating) => {
    const ratingRef = doc(db, 'meetupRatings', rating.ratingId);
    await setDoc(ratingRef, rating, { merge: true });
  },

  subscribeToUserMeetups: (userId: string, callback: (meetups: Meetup[]) => void) => {
    const qHost = query(collection(db, 'meetups'), where('hostUID', '==', userId));
    const qParticipant = query(collection(db, 'meetups'), where('participantUID', '==', userId));

    const meetupsMap = new Map<string, Meetup>();
    
    const unsubHost = onSnapshot(qHost, (snap) => {
      snap.forEach((docSnap) => {
        meetupsMap.set(docSnap.id, docSnap.data() as Meetup);
      });
      callback(Array.from(meetupsMap.values()));
    });

    const unsubParticipant = onSnapshot(qParticipant, (snap) => {
      snap.forEach((docSnap) => {
        meetupsMap.set(docSnap.id, docSnap.data() as Meetup);
      });
      callback(Array.from(meetupsMap.values()));
    });

    return () => {
      unsubHost();
      unsubParticipant();
    };
  }
};
