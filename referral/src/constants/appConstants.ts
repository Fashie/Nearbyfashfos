import { Milestone, QRCodeItem } from '../types';

export function generateReferralCode(name: string = 'USER'): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'NEARBY';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${rand}`;
}

export const MILESTONES: Milestone[] = [
  {
    invitesRequired: 5,
    rewardTitle: '1-Month Premium Subscription',
    rewardDescription: 'Enjoy 1 month of Nearby Premium features (unlimited radar filter, priority badges) after your first 3 free trial months.',
    rewardType: 'subscription'
  },
  {
    invitesRequired: 20,
    rewardTitle: '₦2,000 Cash Reward',
    rewardDescription: 'Instant ₦2,000 credited directly to your claimable balance for inviting 20 verified friends.',
    rewardType: 'cash',
    valueNaira: 2000
  },
  {
    invitesRequired: 30,
    rewardTitle: 'Exclusive "Community Builder" Badge',
    rewardDescription: 'Ultra-rare badge strictly limited to early community builders. Displays proudly on your Nearby profile.',
    rewardType: 'badge',
    badgeName: 'Community Builder',
    limitedCount: 1000,
    claimedGlobalCount: 0
  },
  {
    invitesRequired: 50,
    rewardTitle: 'Nearby T-Shirt & ₦5,000 Cash',
    rewardDescription: 'Receive a branded Nearby official high-quality cotton T-Shirt delivered to your address + ₦5,000 cash bonus.',
    rewardType: 'swag',
    valueNaira: 5000
  },
  {
    invitesRequired: 100,
    rewardTitle: 'Nearby Ambassador Status & Board Channel',
    rewardDescription: 'Become an official Nearby Ambassador! Unlock executive status, direct line to Nearby leadership, monthly stipends & exclusive invitations.',
    rewardType: 'ambassador'
  }
];

export const CAMPUS_QR_CODES: QRCodeItem[] = [
  { id: 'qr_1', code: 'NEARBY-UNILAG-LIB01', campusName: 'UNILAG (Main Library)', locationHint: 'Near the Central Reading Hall Notice Board', prizeNaira: 2000, monthNumber: 1, isRedeemed: false },
  { id: 'qr_2', code: 'NEARBY-UNILAG-FAC02', campusName: 'UNILAG (Faculty of Sci)', locationHint: 'Behind the Chemistry Lecture Theatre', prizeNaira: 2500, monthNumber: 1, isRedeemed: false },
  { id: 'qr_3', code: 'NEARBY-OAU-SUB03', campusName: 'OAU (SUB Building)', locationHint: 'Near the Student Union Amphitheatre Pillars', prizeNaira: 3000, monthNumber: 1, isRedeemed: false },
  { id: 'qr_4', code: 'NEARBY-UI-SUB04', campusName: 'UI (Kenneth Dike Lib)', locationHint: 'Under the shade tree near Faculty of Arts', prizeNaira: 2000, monthNumber: 1, isRedeemed: false },
  { id: 'qr_5', code: 'NEARBY-ABU-SUL05', campusName: 'ABU Zaria (Main Gate)', locationHint: 'Behind the Student Lounge Pavilion', prizeNaira: 5000, monthNumber: 1, isRedeemed: false },
  { id: 'qr_6', code: 'NEARBY-UNN-LIB06', campusName: 'UNN Nsukka (Princess Alex)', locationHint: 'Beside the ICT Center Walkway', prizeNaira: 2000, monthNumber: 1, isRedeemed: false },
  { id: 'qr_7', code: 'NEARBY-FUTA-ENG07', campusName: 'FUTA (SEET Complex)', locationHint: 'Near SEET Auditorium Entrance', prizeNaira: 3500, monthNumber: 1, isRedeemed: false },
  { id: 'qr_8', code: 'NEARBY-LASU-SRC08', campusName: 'LASU Ojo (SRC Hub)', locationHint: 'Beside the Campus Radio Station Lounge', prizeNaira: 2000, monthNumber: 1, isRedeemed: false },
  { id: 'qr_9', code: 'NEARBY-UNIPORT-HUB09', campusName: 'UNIPORT (Choba Campus)', locationHint: 'Near the Sports Complex Bleachers', prizeNaira: 4000, monthNumber: 1, isRedeemed: false },
  { id: 'qr_10', code: 'NEARBY-BENIN-HALL10', campusName: 'UNIBEN (Ugbowo Campus)', locationHint: 'At Hall 2 Car Park Kiosk', prizeNaira: 5000, monthNumber: 1, isRedeemed: false }
];
