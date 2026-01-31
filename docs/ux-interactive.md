# UX Interactive Refactor - In-Spectra Asset Control App

## 📋 Audit Summary

### Current Navigation Stack
- **Root Stack** (`app/_layout.tsx`):
  - `login` - Login screen
  - `(tabs)` - Tab-based navigation (main app)
  - `asset/[id]` - Equipment detail
  - `mission/[id]` - Mission detail
  - `mission/create` - Create mission (modal)
  - `mission/execute` - Execute control
  - `nc/[id]` - Non-conformity detail
  - `nc/create` - Create NC (modal)
  - `maintenance/add` - Add maintenance (modal)
  - `profile` - User profile
  - `reset-password` - Password reset
  - `client/[id]` - Client profile ✨ **NEW**

### Tab Screens (`app/(tabs)/`)
1. **index** - Dashboard/KPI board (Technician)
2. **manager** - Manager dashboard (Manager role)
3. **validation** - Validation screen (Manager role)
4. **sites** - Sites/Clients browser (all roles)
5. **inventory** - Equipment list (all roles)
6. **planning** - Schedule/Due dates (all roles)
7. **missions** - Mission list (all roles)
8. **nc** - Non-conformities (all roles)
9. **admin** - Admin panel (Admin role)
10. **vgp** - VGP/Presses management (all roles)
11. **sync** - Offline sync (all roles)
12. **validation** - Validation (Manager)

### Key Entities & Navigation Flow
```
Clients (list)
  └─> Client Detail (client/[id])
      ├─> Sites (list within client)
      │   └─> Site Detail (inventory with siteId filter)
      │       └─> Equipment Detail (asset/[id])
      │           ├─> Controls/Reports
      │           ├─> Non-conformities
      │           └─> Maintenance logs
      ├─> Equipment (list)
      │   └─> Equipment Detail
      ├─> Statistics (stats from API)
      └─> Actions (edit, delete - Admin only)

Sites (tabs/sites)
  └─> Site browser (expandable by client)
      ├─> View Equipment (in site)
      │   └─> Equipment Detail
      └─> Client info (tap to navigate to client)

Equipment (tabs/inventory)
  └─> Equipment list
      └─> Equipment Detail
          ├─> Last control/Report (tap to view)
          ├─> Next due date (tap to planning view)
          ├─> Documents/Attachments (tap to viewer)
          └─> Non-conformities

Profile (app/profile)
  └─> User info display
      ├─> Tap avatar/name → Edit Profile (NEW)
      ├─> Change password
      └─> Request password reset

Admin Panel (tabs/admin)
  └─> Manage Users
      ├─> Create user
      ├─> Edit user
      ├─> Send password reset
      └─> Delete user
```

### Current State Issues
1. ❌ **Header avatar not interactive** - Profile button exists but needs standardization
2. ❌ **Client details not clickable** - Names/badges are static text
3. ❌ **Equipment without drill-down** - Equipment names are not linkable
4. ❌ **No profile edit screen** - Profile page exists but no "Edit" functionality
5. ❌ **Reports/Docs not clickable** - Static display, no viewers
6. ❌ **Site-to-Client navigation missing** - Can expand sites but not navigate to client detail
7. ❌ **No status/due date filters** - Badges are decorative only

### Components Inventory
- ✅ `Card.tsx` - Base card with optional onPress
- ✅ `Button.tsx` - Primary button component
- ✅ `Badge.tsx` - Status badges
- ✅ `ListItem.tsx` - List item component
- ✅ `Input.tsx` - Form input
- ✅ `DataTable.tsx` - Table display
- ❌ `PressableCard` - NOT FOUND (needs creation)
- ❌ `ClickableRow` - NOT FOUND (needs creation)
- ❌ `EntityLink` - NOT FOUND (needs creation)
- ❌ `StatChipLink` - NOT FOUND (needs creation)
- ❌ `AvatarButton` - NOT FOUND (needs creation)

### Auth & Roles
- Roles: `TECHNICIAN`, `MANAGER`, `ADMIN`
- Protected routes already implemented via `useAuth()`
- Admin-only actions: User management, Site/Equipment creation
- Manager: Validation, statistics
- Technician: View-only + own mission execution

---

## 🎯 Plan of Work

### Phase 1: Navigation Infrastructure
**Goal**: Establish clean navigation patterns and route builders

**Files to modify/create**:
1. `lib/navigation.ts` - Route builders, deep links, navigation helpers
2. `app/_layout.tsx` - Add new stack screens (ProfilEdit, DocumentViewer)
3. `app/(tabs)/_layout.tsx` - Standardize header with avatar button

**Key Changes**:
- [ ] Create route builder functions: `clientRoute()`, `siteRoute()`, `equipmentRoute()`, etc.
- [ ] Add `ProfileEdit` screen to root stack
- [ ] Add `DocumentViewer` stack (if not exists)
- [ ] Standardize header avatar button across all tabs
- [ ] Add back button titles to screens

### Phase 2: Interactive Components Library
**Goal**: Create reusable pressable components

**Files to create**:
1. `components/interactive/PressableCard.tsx` - Card with press feedback + chevron
2. `components/interactive/ClickableRow.tsx` - Row with icon, text, chevron, press effect
3. `components/interactive/EntityLink.tsx` - Text link to entity (Client, Site, Equipment)
4. `components/interactive/StatChipLink.tsx` - Chip/badge that navigates (status, due date, count)
5. `components/interactive/AvatarButton.tsx` - Profile avatar (header-ready)
6. `components/interactive/index.ts` - Barrel export

**Common Props Pattern**:
```typescript
{
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  children?: React.ReactNode;
}
```

### Phase 3: Profile System Refactor
**Goal**: Complete Profile + ProfileEdit flow

**Files to modify/create**:
1. `app/profile.tsx` - Display user info + "Edit" button (header or top CTA)
2. `app/profile-edit.tsx` - NEW - Form to edit name, email (if allowed), password fields
3. `contexts/AuthContext.tsx` - Add profile update methods if needed
4. `app/_layout.tsx` - Add `profile-edit` route

**Changes**:
- [ ] Add pencil icon button (header) on profile screen → navigate to ProfileEdit
- [ ] ProfileEdit form: name, email (read-only?), password change section
- [ ] Add loading/error states, validation
- [ ] Back button returns to Profile with refresh
- [ ] Success message after save

### Phase 4: Screen-by-Screen Interactivity
**Goal**: Add drill-down navigation to all major screens

#### 4.1 Dashboard (tabs/index)
- [ ] Equipment count card → inventory
- [ ] Overdue card → planning (filtered by overdue)
- [ ] Due soon card → planning (filtered by due 30d)
- [ ] Urgent echéances → individual mission/control detail
- [ ] Avatar header → profile

#### 4.2 Clients & Sites (tabs/sites)
- [ ] Client name → client detail view (client/[id])
- [ ] Site name → inventory filtered to site
- [ ] Equipment count → inventory filtered to site
- [ ] Expand/collapse UI already present

#### 4.3 Client Detail (client/[id])
- [ ] Site list (tappable) → inventory filtered to site
- [ ] Equipment count → inventory filtered to site
- [ ] Last report date → report detail
- [ ] Next due date → planning filtered
- [ ] Edit button (if admin) → edit modal/form
- [ ] Back button → sites list

#### 4.4 Inventory/Equipment (tabs/inventory)
- [ ] Equipment name → asset detail
- [ ] Site name (if visible) → client detail
- [ ] Last control date → control detail
- [ ] Status badge → filter view by status
- [ ] Add equipment button (Admin only, already present)

#### 4.5 Equipment Detail (asset/[id])
- [ ] Equipment name (header) → copy to clipboard + show full name
- [ ] Site name → inventory filtered to site
- [ ] Client name (if visible) → client detail
- [ ] Last control/report (in controls tab) → report detail
- [ ] Next due date (chip) → planning filtered
- [ ] Non-conformity rows → nc/[id]
- [ ] Maintenance rows → detail modal
- [ ] Documents/attachments → document viewer

#### 4.6 Planning (tabs/planning)
- [ ] Due echéance row → equipment detail (asset/[id])
- [ ] Equipment name → asset detail
- [ ] Tap to execute → mission/execute

#### 4.7 Non-conformities (tabs/nc)
- [ ] NC row → nc/[id]
- [ ] Equipment name → asset detail
- [ ] Actions row → action detail

#### 4.8 Admin Panel (tabs/admin)
- [ ] User row → tap to edit (inline or modal)
- [ ] Client row → client detail (if not already linked)
- [ ] Site row → inventory filtered
- [ ] Send password reset button (✓ already exists)

#### 4.9 Profile (app/profile)
- [ ] Header: Add "Edit" button (pencil icon) → profile-edit
- [ ] Name, email display as text (not editable on this screen)
- [ ] Password reset section
- [ ] Logout button

#### 4.10 ProfileEdit (app/profile-edit) - NEW
- [ ] Form: Name (editable), Email (read-only or editable), Role (read-only)
- [ ] Validation + error display
- [ ] Save button, loading state
- [ ] Cancel button → back to profile
- [ ] Success message

### Phase 5: Accessibility & Polish
**Goal**: Ensure a11y compliance and visual consistency

**Checklist**:
- [ ] All pressable zones ≥ 44px (height/width)
- [ ] Active opacity/ripple feedback on all Pressables
- [ ] accessibilityLabel on all pressable items
- [ ] accessibilityRole="button" on custom pressables
- [ ] Screen reader labels for icons
- [ ] Keyboard navigation (if needed for web)
- [ ] Test with screen reader (mobile)
- [ ] Chevron icons on all navigable items
- [ ] Consistent spacing & alignment

### Phase 6: Analytics & Testing
**Goal**: Add minimal instrumentation for navigation tracking

**Files to create**:
1. `lib/analytics.ts` - Navigation event helpers (stub if no analytics service)

**Events to track**:
- `navigate_to_profile`
- `navigate_to_profile_edit`
- `navigate_to_client`
- `navigate_to_site`
- `navigate_to_equipment`
- `navigate_to_report`
- `navigate_to_nc`

**Tests to add**:
- [ ] `app/(tabs)/index.test.tsx` - Avatar tap → Profile
- [ ] `app/profile.test.tsx` - Edit button tap → ProfileEdit
- [ ] `app/profile-edit.test.tsx` - Save form, back button
- [ ] `app/(tabs)/sites.test.tsx` - Client tap → ClientDetail
- [ ] `app/client/[id].test.tsx` - Site tap → Inventory
- [ ] `app/asset/[id].test.tsx` - Last report tap → ReportDetail

---

## 🎨 Design System

### Interactive Component Patterns

#### Pattern 1: PressableCard
```tsx
<PressableCard
  onPress={() => navigate('Client', { id })}
  disabled={!canAccess}
>
  <Text>{clientName}</Text>
  <Badge variant="secondary">{siteCount} sites</Badge>
</PressableCard>
```
**Styling**: Card + opacity feedback + chevron right

#### Pattern 2: ClickableRow
```tsx
<ClickableRow
  icon={<Package size={20} />}
  title="Equipment Name"
  subtitle="Site Name"
  onPress={() => navigate('Equipment', { id })}
/>
```
**Styling**: Row layout + chevron + active state

#### Pattern 3: EntityLink
```tsx
<EntityLink
  label="Client:"
  value={clientName}
  onPress={() => navigate('Client', { id })}
/>
```
**Styling**: Text link style + underline on press

#### Pattern 4: StatChipLink
```tsx
<StatChipLink
  label="Last Control"
  value={lastControlDate}
  onPress={() => navigate('Report', { id })}
  variant="info"
/>
```
**Styling**: Chip/badge + press feedback

#### Pattern 5: AvatarButton
```tsx
<AvatarButton
  user={user}
  onPress={() => navigate('Profile')}
/>
```
**Styling**: Circular button, initials or icon

### Accessibility Guidelines
- **Min touch target**: 44x44 pts (iOS), 48x48 dp (Android)
- **Min contrast**: 4.5:1 for text, 3:1 for graphics
- **Focus indicators**: Visible when tabbing (web)
- **Labels**: All icons have `accessibilityLabel`
- **Roles**: `button`, `link`, `header`, etc.

---

## 📁 File Structure Changes

### New Files to Create
```
components/
  interactive/
    ├─ PressableCard.tsx
    ├─ ClickableRow.tsx
    ├─ EntityLink.tsx
    ├─ StatChipLink.tsx
    ├─ AvatarButton.tsx
    └─ index.ts

lib/
  ├─ navigation.ts (NEW)
  └─ analytics.ts (NEW)

app/
  ├─ profile-edit.tsx (NEW)
  └─ client/
     └─ [id].tsx (already exists, will be enhanced)

__tests__/ (or existing test folder)
  ├─ app-navigation.test.tsx
  ├─ profile-flow.test.tsx
  └─ drill-down.test.tsx

docs/
  └─ ux-interactive.md (THIS FILE)
```

### Modified Files
- `app/_layout.tsx` - Add ProfileEdit, fix headers
- `app/(tabs)/_layout.tsx` - Standardize header avatar
- `app/profile.tsx` - Add Edit button
- `app/(tabs)/index.tsx` - Make cards/sections pressable
- `app/(tabs)/sites.tsx` - Make client/site names pressable
- `app/client/[id].tsx` - Make sections pressable
- `app/asset/[id].tsx` - Make entity links pressable
- `app/(tabs)/inventory.tsx` - Make equipment rows pressable
- `app/(tabs)/planning.tsx` - Make echéance rows pressable
- `app/(tabs)/nc.tsx` - Make NC rows pressable
- `app/(tabs)/admin.tsx` - Make user/client/site rows pressable

---

## ✅ Validation Checklist

### Before Starting Implementation
- [ ] Navigation structure finalized
- [ ] All screens mapped to drill-down targets
- [ ] Component library requirements defined
- [ ] Auth/roles verification complete
- [ ] Design tokens (colors, spacing) confirmed
- [ ] Accessibility requirements clear

### During Implementation
- [ ] Each component has onPress handler
- [ ] Chevron icons added to navigation items
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Role-based visibility applied
- [ ] Tests pass for each module

### After Implementation
- [ ] Avatar → Profile (Dashboard)
- [ ] Profile (Edit btn) → ProfileEdit
- [ ] ProfileEdit (Save) → Profile (updated)
- [ ] Client name → Client detail
- [ ] Site name → Inventory (filtered)
- [ ] Equipment name → Equipment detail
- [ ] Report/Control row → Detail
- [ ] Status chip → Filtered view
- [ ] All pressable zones ≥ 44px
- [ ] Chevrons visible on navigable items
- [ ] No dead links
- [ ] No "ghost" buttons (invisible or unreachable)
- [ ] Load times < 2s per screen
- [ ] All roles can navigate to intended screens

---

## 🚀 Implementation Notes

### Avoid Breaking Changes
1. Keep existing `Card` component as-is, create new `PressableCard` if different
2. Keep existing `Button` component, use for CTA areas
3. Keep route names exactly as-is
4. Don't remove any existing props
5. Add deprecation warnings if replacing patterns

### Migration Path
1. **Week 1**: Navigation helpers + ProfileEdit screen + interactive components
2. **Week 2**: Dashboard, Clients, Sites interactivity
3. **Week 3**: Equipment detail, Planning, Admin screens
4. **Week 4**: Testing, accessibility refinement, analytics

### Support Required
- No backend changes needed
- Existing queries/mutations compatible
- Auth context already provides user info + role checks
- Database schema unchanged

---

**Last Updated**: 2025-01-31  
**Status**: READY FOR IMPLEMENTATION  
**Reviewer**: GitHub Copilot (DevOps/UX focus)
