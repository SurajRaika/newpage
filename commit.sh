#!/bin/bash
git commit -m 'feat: Refactor DynamicGreeting to a modular event-driven system

This commit introduces a complete overhaul of the DynamicGreeting component, moving from a monolithic Astro component to a more robust, scalable, and maintainable event-driven architecture.

The new implementation is composed of the following key parts:

- **DynamicGreetingHub:** The central hub that manages the event lifecycle, including queuing, throttling, and cooldowns.
- **UIManager:** A dedicated class for handling all UI/UX related operations, such as displaying and hiding events.
- **BaseEvent:** An abstract class that defines the common interface for all events.
- **Event Subclasses:** Specific event implementations, such as `TimeOfDayEvent`, `InactivityEvent`, and `RandomTipEvent`, each responsible for their own triggering logic and content.

This new architecture provides several advantages:

- **Improved Scalability:** New event types can be added easily by creating new subclasses of `BaseEvent`.
- **Better Separation of Concerns:** The UI, event logic, and hub are now clearly separated, making the code easier to understand and maintain.
- **Increased Robustness:** The new system includes features like event queuing, throttling, and cooldowns to prevent event spam and ensure a smooth user experience.'
