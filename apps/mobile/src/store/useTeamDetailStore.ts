import { create } from 'zustand'
import type { Team, TeamMember, TeamStatsSnapshot, TeamChallenge } from '../types/teams'

interface TeamDetailState {
  currentTeam: Team | null
  members: TeamMember[]
  stats: TeamStatsSnapshot | null
  challenges: TeamChallenge[]

  setCurrentTeam: (team: Team) => void
  setMembers: (members: TeamMember[]) => void
  setStats: (stats: TeamStatsSnapshot) => void
  setChallenges: (challenges: TeamChallenge[]) => void
  addMember: (member: TeamMember) => void
  removeMember: (userId: string) => void
  updateMemberContribution: (userId: string, contribution: Partial<TeamMember['contribution']>) => void
  clear: () => void
}

export const useTeamDetailStore = create<TeamDetailState>((set, get) => ({
  currentTeam: null,
  members: [],
  stats: null,
  challenges: [],

  setCurrentTeam: (team) => set({ currentTeam: team }),

  setMembers: (members) => set({ members }),

  setStats: (stats) => set({ stats }),

  setChallenges: (challenges) => set({ challenges }),

  addMember: (member) =>
    set((state) => ({
      members: [...state.members, member],
    })),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((member) => member.userId !== userId),
    })),

  updateMemberContribution: (userId, contribution) =>
    set((state) => ({
      members: state.members.map((member) =>
        member.userId === userId
          ? {
              ...member,
              contribution: {
                ...member.contribution,
                ...contribution,
              },
            }
          : member
      ),
    })),

  clear: () =>
    set({
      currentTeam: null,
      members: [],
      stats: null,
      challenges: [],
    }),
}))
