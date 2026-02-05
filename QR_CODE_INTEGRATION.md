# QR Code Integration Guide

This document outlines the standard for QR code generation and verification within the Badminton Booking System.

## Format

The QR code contains a URL that points to the verification page of the Smash Partner platform.

**Format:**
```
https://smashpartner.online/verify/{booking_id}
```

**Example:**
```
https://smashpartner.online/verify/550e8400-e29b-41d4-a716-446655440000
```

## Implementation Details

### Generation
The QR code is generated using the `react-qr-code` library in the frontend.

```tsx
import QRCode from "react-qr-code";

<QRCode
    value={`https://smashpartner.online/verify/${booking.id}`}
    size={160}
    viewBox={`0 0 256 256`}
    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
    level="H" // High error correction level
/>
```

### Verification
When the QR code is scanned:
1.  The scanner opens the URL `https://smashpartner.online/verify/{booking_id}`.
2.  The target page should handle the verification logic (e.g., checking if the booking is valid, active, and belongs to the correct venue).

## UI/UX Considerations
-   The QR code should be displayed prominently on the E-Ticket.
-   Ensure sufficient contrast (black module color on white background).
-   Include a "Quiet Zone" (padding) around the QR code for better scannability.