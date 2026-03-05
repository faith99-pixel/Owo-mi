# Owó Mi - Nigerian Personal Finance Tracker

**"The Truth-Teller"** - An Android app that reads SMS debit alerts and shows Nigerians where their money is leaking.

## What It Does

- Reads SMS debit alerts from Nigerian banks (GTBank, UBA, FirstBank, Access, Zenith, etc.)
- Automatically categorizes spending (Transport, Betting, Airtime, Data, Food, etc.)
- Detects money "leaks" (POS charges, multiple data purchases, betting, etc.)
- Shows shareable insights with Nigerian humor
- 100% on-device processing - no data sent to servers

## Features

✅ SMS permission with clear privacy explanation
✅ Nigerian bank SMS parser (handles N, ₦, NGN formats)
✅ Smart categorization (Bolt, Bet9ja, DSTV, etc.)
✅ Dashboard with total spending
✅ Leak detection algorithm
✅ Shareable "shame cards" for social media
✅ Room database for local storage
✅ Material 3 UI with Jetpack Compose

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Database**: Room
- **Architecture**: MVVM with ViewModel
- **Min SDK**: 21 (Android 5.0) - covers 95% of Nigerian devices

## Project Structure

```
app/src/main/java/com/owomi/
├── MainActivity.kt              # Entry point with SMS permission
├── data/
│   ├── Transaction.kt           # Data model
│   ├── TransactionDao.kt        # Database operations
│   ├── OwomiDatabase.kt         # Room database
│   └── LeakDetector.kt          # Money leak detection algorithm
├── sms/
│   ├── SmsReader.kt             # Reads SMS from Nigerian banks
│   └── SmsParser.kt             # Parses Nigerian bank SMS formats
├── viewmodel/
│   └── OwomiViewModel.kt        # App state management
└── ui/
    ├── OwomiApp.kt              # Main navigation
    ├── DashboardScreen.kt       # Spending overview
    ├── InsightsScreen.kt        # Leak detection + sharing
    ├── TransactionsScreen.kt    # Transaction list
    └── theme/
        └── Theme.kt             # Material 3 theme
```

## Setup Instructions

### Prerequisites
- Android Studio (latest version)
- JDK 17
- Android SDK with API 21+

### Steps

1. **Open in Android Studio**
   - File → Open → Select this folder
   - Wait for Gradle sync

2. **Build the project**
   ```bash
   ./gradlew build
   ```

3. **Run on device/emulator**
   - Connect Android device or start emulator
   - Click Run (▶️) in Android Studio

4. **Grant SMS permission**
   - App will request SMS permission on first launch
   - Accept to allow reading debit alerts

## Testing

Test with these sample Nigerian bank SMS formats:

```
GTBank: Withdrawal of N15,000 from Account 1234567890 at ATM
UBA: N2,500 debited for BET9JA transaction
FirstBank: Your airtime purchase of N500 is successful
AccessBank: N35,000 transferred to MUM
GTBank: Purchase of N8,500 at SPAR
UBA: POS withdrawal of N20,000 at ShopRite
FirstBank: Your DSTV subscription of N4,800 was successful
```

## Nigerian-Specific Features

- **Bank Support**: GTBank, UBA, FirstBank, Access, Zenith, Fidelity, Kuda, Sterling, FCMB, Ecobank
- **Merchants**: Bet9ja, SportyBet, Bolt, Uber, Jumia, Konga, DSTV, GOtv
- **Currency**: Handles N, ₦, NGN with commas (N5,000)
- **Language**: Mix of English and Pidgin in UI
- **Categories**: Betting, POS charges, Transport (Nigerian context)

## Privacy

- All SMS processing happens ON-DEVICE
- No data sent to servers
- No internet permission required
- Users can delete all data anytime

## Roadmap

### MVP (Current)
- ✅ SMS reading
- ✅ Transaction parsing
- ✅ Categorization
- ✅ Leak detection
- ✅ Basic sharing

### Phase 2
- [ ] Charts and graphs
- [ ] Budget setting
- [ ] Weekly notifications
- [ ] Manual transaction entry
- [ ] Export to CSV

### Phase 3
- [ ] Peer comparison (anonymous)
- [ ] Savings suggestions
- [ ] Cloud backup (encrypted, opt-in)
- [ ] Multiple accounts

## Contributing

This is an MVP. Focus areas:
1. **Parser accuracy**: Add more Nigerian bank formats
2. **Categorization**: Improve merchant detection
3. **Leak detection**: Add more Nigerian-specific patterns
4. **UI polish**: Make it more shareable

## License

MIT License - Build and share freely

---

**Built for Nigerians, by Nigerians 🇳🇬**

*"Owó Mi" means "My Money" in Yoruba*
