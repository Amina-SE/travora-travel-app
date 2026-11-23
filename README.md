# ✈️ Travora – Travel Booking App

Travora is a mobile travel booking application designed to bring multiple travel services together in one place. Users can explore travel options, search journeys, manage trips, save stays, and manage their profiles through a modern and interactive interface.

The application is developed using **React Native and Expo**, with Firebase Authentication and Cloud Firestore for user authentication and cloud data storage.

## 📱 Project Overview

Travora provides a unified travel experience with booking flows for:

- ✈️ Flights
- 🚌 Coach journeys
- 🚆 Train journeys
- 🏨 Hotels and stays
- 🚗 Car rentals

The application includes approximately **20 screens**, 27 source files, and around 6,500 lines of code.

## ✨ Features

### User Authentication

- Email and password sign-up and sign-in
- Google sign-in integration
- Password reset functionality
- Guest access
- Account deletion
- Sign-in with Apple interface (currently local and not connected to Firebase)

### Travel and Booking

- Explore different travel services
- Search and view travel results
- Flight cabin and seat selection
- Hotel and room exploration
- Car rental interface
- Checkout and billing flows
- Booking success and ticket screens

### User Experience

- Onboarding screens
- Animated navigation and screen transitions
- Interactive components and touch feedback
- Saved stays and trip management
- Profile editing
- Payment method management interface
- Help and support screen

### Data Management

- Local state persistence using AsyncStorage
- Cloud data storage using Firebase Cloud Firestore
- Separate user data for signed-in accounts
- Guest data stored locally
- Firestore security rules for user-specific access

## 🛠️ Technology Stack

| Technology                     | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| React Native                   | Cross-platform mobile application development |
| React 19                       | Component-based application development       |
| Expo SDK 58                    | Development environment and toolchain         |
| JavaScript (JSX)               | Main programming language                     |
| Firebase Authentication        | User authentication                           |
| Cloud Firestore                | Cloud database                                |
| AsyncStorage                   | Local data persistence                        |
| React Context API              | Global state management                       |
| React Native Animated API      | Screen and component animations               |
| React Native SVG               | Vector graphics and illustrations             |
| Expo Linear Gradient           | Gradient styling                              |
| Expo Haptics                   | Touch and vibration feedback                  |
| Expo Vector Icons              | Application icons                             |
| React Native Safe Area Context | Safe-area layout support                      |

## 🧭 Navigation and State Management

Travora uses a **custom animated stack navigator** implemented in `src/nav.js`, rather than React Navigation or Expo Router.

The navigation system provides:

- `push()` – Opens a new screen.
- `pop()` – Returns to the previous screen.
- `replace()` – Replaces the current screen.
- `reset()` – Clears navigation history.
- `popTo()` – Returns to a specified screen.

Screen transitions include slide, fade, zoom, and rise animations.

Application-wide state is managed through the React Context API using `StoreProvider`, while AsyncStorage maintains local data between app launches.

## 🔐 Backend and Data Storage

Firebase is used for authentication and cloud data management.

- Firebase Authentication handles email and password authentication.
- Google sign-in is integrated through the Google Sign-In library.
- Cloud Firestore stores user-specific bookings, saved stays, cards, and billing-related data.
- Firestore security rules restrict users to their own data.
- AsyncStorage maintains locally saved application state.

**Note:** Full payment card numbers are not stored. Search results and payment processing are simulated for this project.

## 📲 Application Screens

The project includes the following screens and sections:

1. Splash
2. Onboarding
3. Sign In
4. Sign Up
5. Main – Explore, Trips, Saved, and Profile
6. Search
7. Results
8. Cabin and Seat Selection
9. Walkthrough
10. Hotel
11. Room
12. Cars
13. Checkout
14. Billing
15. Add Card
16. Payment Methods
17. Success
18. Ticket
19. Edit Profile
20. Help

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Expo CLI / Expo tooling
- Expo Go on your mobile device
- A Firebase project configured for the application

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Amina-SE/travora-travel-app.git
   ```

2. Navigate to the project directory:

   ```bash
   cd travora-travel-app
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure your Firebase environment variables using the instructions in the project setup documentation.

5. Start the development server:

   ```bash
   npx expo start
   ```

6. Scan the QR code using Expo Go or use an appropriate development build for native integrations.

## 📁 Project Structure

The application is organized into reusable screens, components, navigation, and state-management modules.

```text
travora-travel-app/
│
├── App.js
├── src/
│   ├── nav.js
│   ├── store.js
│   ├── ui.js
│   ├── cloud.js
│   ├── auth/
│   │   └── social.js
│   └── components/
│
├── assets/
├── package.json
├── package-lock.json
├── app.json
├── .gitignore
├── .env.example
└── README.md
```

_Note: This is an illustrative overview of the main project areas. The actual folder structure may contain additional files and folders._

## ⚠️ Project Notes

- Travel search results are generated using a seeded function and are not connected to live travel inventory.
- Payment flows are simulated and do not process real transactions.
- Apple sign-in is currently a local interface and is not connected to Firebase.
- Google sign-in requires a suitable development build and is not supported through Expo Go alone.
- Firebase configuration must be supplied locally through environment variables.

## 🎓 Academic Context

**Project:** Travora – Travel Booking App  
**Framework:** React Native with Expo  
**Language:** JavaScript (JSX)  
**Backend:** Firebase Authentication and Cloud Firestore

## 👩‍💻 Author

**Amina Batool**  
Software Engineering Student  
Riphah International University

- GitHub: [Amina-SE](https://github.com/Amina-SE)
- LinkedIn: [Amina Batool](https://www.linkedin.com/in/amina-bytes/)

---

_Built with React Native, Expo, and Firebase._
