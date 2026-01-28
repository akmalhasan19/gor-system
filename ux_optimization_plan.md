# UX/UI Optimization Plan: Smash Partner PWA

This document outlines the roadmap for optimizing the user experience of the Smash Partner PWA, focusing on simplifying navigation and reducing friction for power users.

## 🎯 Primary Goal
Make the system "Simple and Straightforward" by removing navigation speed bumps and improving visual clarity, specifically distinguishing between Desktop (Admin/Cashier) and Mobile workflows.

## 📅 Phase 1: Navigation Structure (High Impact)
*Goal: Remove the "Speed Bump" for Desktop users by exposing the menu.*

- [x] **Refactor Navigation Layout**
    - [x] Create a `Sidebar` component for Desktop view (hidden on mobile).
    - [x] Modify `page.tsx` to switch between `Sidebar` (Desktop) and `Navbar/Hamburger` (Mobile) based on screen width.
    - [x] Ensure `Sidebar` persists the `activeTab` state correctly.
    - [x] **Fix Layout Width**: Removed `max-w-[480px]` constraint to allow full-screen desktop interface.
- [x] **Optimize Menu Items**
    - [x] Add tooltips to Sidebar icons for clarity.
    - [x] Ensure "Log Out" is easily accessible but distinct from main navigation.

## 🎨 Phase 2: Visual Consistency & Feedback
*Goal: Ensure the system communicates clearly with the user.*

- [ ] **Standardize Terminology**
    - [ ] Rename "Kantin & Shop" header to match menu "Kantin / POS".
    - [ ] Ensure "Shift" terminology is consistent (Kasir vs Shift).
- [ ] **Enhance Feedback Loops**
    - [ ] Verify `toast` notifications for ALL "Save", "Delete", and "Update" actions across all modules.
    - [ ] Add "Empty States" for tables/lists (e.g., "Belum ada member" instead of blank space).

## ⚡ Phase 3: Workflow Refinement (Booking & POS)
*Goal: Streamline the most frequent actions.*

- [ ] **Booking Modal Optimization**
    - [ ] Group "Advanced Options" (Recurring, Deposit) into a collapsible section (e.g., `<details>`).
    - [ ] Highlight the "Simpan" button more prominently than secondary actions.
- [ ] **POS Interaction**
    - [ ] Review "Add to Cart" feedback (maybe a small animation or sound?).
    - [ ] Ensure the "Cart" button on mobile doesn't obscure important content.

## 🧪 Verification Strategy
- **Desktop Walkthrough**: Perform a full shift (Opening -> Booking -> Selling -> Closing) without using the Hamburger menu.
- **Mobile Walkthrough**: Ensure the new Sidebar doesn't break the mobile experience.
