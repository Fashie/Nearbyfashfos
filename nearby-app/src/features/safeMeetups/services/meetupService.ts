import { db, auth, handleFirestoreError, OperationType } from '../../../firebase';
import { Meetup, MeetupRating } from '../../../types';
import { collection, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';

export const meetupService = {
  scheduleMeetup: async (meetup: Meetup) => {
    if (!auth.currentUser) throw new Error('You must be signed in to schedule a meetup.');
    try {
      await setDoc(doc(db, 'meetups', meetup.meetupId), meetup, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `meetups/${meetup.meetupId}`);
      throw err;
    }
  },

  rateMeetup: async (rating: MeetupRating) => {
    if (!auth.currentUser) throw new Error('You must be signed in to rate a meetup.');
    try {
      await setDoc(doc(db, 'meetupRatings', rating.ratingId), rating, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `meetupRatings/${rating.ratingId}`);
      throw err;
    }
  },

  subscribeToUserMeetups: (userId: string, callback: (meetups: Meetup[]) => void, onError?: (error: Error) => void) => {
    if (!auth.currentUser || auth.currentUser.uid !== userId) return () => undefined;
    const meetupsMap = new Map<string, Meetup>();
    const emit = () => callback(Array.from(meetupsMap.values()));
    const handleError = (error: Error) => {
      handleFirestoreError(error, OperationType.LIST, 'meetups');
      onError?.(error);
    };

    const unsubHost = onSnapshot(
      query(collection(db, 'meetups'), where('hostUID', '==', userId)),
      (snap) => { snap.forEach((d) => meetupsMap.set(d.id, d.data() as Meetup)); emit(); },
      handleError,
    );
    const unsubParticipant = onSnapshot(
      query(collection(db, 'meetups'), where('participantUID', '==', userId)),
      (snap) => { snap.forEach((d) => meetupsMap.set(d.id, d.data() as Meetup)); emit(); },
      handleError,
    );

    return () => { unsubHost(); unsubParticipant(); };
  },
};
