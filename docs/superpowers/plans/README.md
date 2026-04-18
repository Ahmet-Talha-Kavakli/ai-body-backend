# Phase 1-7 Implementation Plans

This directory contains detailed implementation plans for all 7 phases of the mobile app development.

## Phase Plans

### Phase 1: Auth + Core Dashboard (10 days)

- **Files:**
  - [Part 1](2026-04-18-phase1-implementation-part1.md) — Setup, Infrastructure, Database, Utilities
  - [Part 2](2026-04-18-phase1-implementation-part2.md) — UI Components, Auth Screens, Dashboard Screens
  - [Part 3](2026-04-18-phase1-implementation-part3.md) — Profile, Settings, Navigation, Testing

**Implementation:** 50+ files, 120+ tests, 10 tasks, 20 subtasks per task
**Execution:** ~10 days (1 engineer) or ~4-5 days (subagent-driven-development)

---

## How to Use These Plans

1. **Read the full spec first:**
   - `docs/superpowers/specs/2026-04-18-phase1-complete-auth-dashboard.md`

2. **Follow the implementation plan:**
   - Start with Task 1 in Part 1
   - Each task has numbered steps
   - Each step is 2-5 minutes
   - Commit after each task

3. **Execution method:**
   - Use `superpowers:subagent-driven-development` for parallel execution
   - Each subagent gets 3-4 independent tasks
   - Two-stage review (spec compliance + code quality)
   - Frequent commits (one per task)

4. **Testing:**
   - Run tests after each task
   - Aim for 80%+ coverage
   - Use `pnpm test` in `apps/mobile/`

5. **Progress tracking:**
   - Use checkbox `- [ ]` for each step
   - Mark complete when test passes
   - Commit frequently

---

## Plan Structure

Each plan document has:

1. **File Structure** — all files to create/modify
2. **Chunks** — logical groupings (2-3 tasks per chunk)
3. **Tasks** — implementation units (10-15 steps each)
4. **Steps** — atomic actions (write test, implement, verify, commit)

---

## Key Principles

- **TDD:** Write failing test first, then implement, then commit
- **Small Commits:** One commit per task
- **Type Safety:** 100% TypeScript, strict mode
- **Testing:** Vitest for unit, React Testing Library for integration
- **Documentation:** README, inline comments, type definitions
- **Offline First:** SQLite caching, sync queue, retry logic

---

## Estimated Timeline

| Phase                    | Duration   | Status     |
| ------------------------ | ---------- | ---------- |
| 1: Auth + Dashboard      | 10 days    | 📋 Planned |
| 2: Workout System        | 7-10 days  | ⏳ Queued  |
| 3: Nutrition System      | 5-7 days   | ⏳ Queued  |
| 4: Health Integration    | 4-5 days   | ⏳ Queued  |
| 5: Social & Gamification | 6-7 days   | ⏳ Queued  |
| 6: AI Memory Layer       | 8-10 days  | ⏳ Queued  |
| 7: Advanced Features     | 12-15 days | ⏳ Queued  |

**Total:** ~52-70 days (1 engineer sequential) or ~10-12 weeks (subagent-driven)

---

## Subagent-Driven Execution

To execute this plan with subagents:

```bash
# Start execution (from apps/mobile/)
pnpm prepare # Install deps, initialize DB
pnpm test    # Verify test framework

# Then dispatch:
# "Use superpowers:subagent-driven-development to implement Phase 1"
```

Each subagent will:

1. Pick 3-4 independent tasks
2. Create worktree (isolated branch)
3. Implement all steps with TDD
4. Submit for review
5. Merge on approval

---

## Success Criteria

✅ **By end of Phase 1:**

- 50+ source files
- 120+ tests passing
- Zero TypeScript errors
- Full offline support
- Expo Go compatible
- Complete auth flow
- Dashboard with 6 health tabs
- Settings screen

✅ **Code Quality:**

- 80%+ test coverage
- Type-safe (no `any` types)
- Proper error handling
- Loading states on all async
- Network detection
- Graceful degradation

---

## Next Steps

1. **Approval:** User reviews spec and plan
2. **Execution:** Use subagent-driven-development
3. **Merge:** PR to main after Phase 1
4. **Phase 2:** Repeat process for Workout System

---

For questions, see the full specs in `docs/superpowers/specs/`.
