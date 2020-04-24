# Texas-Holdem

Texas hold 'em is one of the most popular variants of the card game of poker. Two cards, known as hole cards, are dealt face down to each player, and then five community cards are dealt face up in three stages. The stages consist of a series of three cards ("the flop"), later an additional single card ("the turn" or "fourth street"), and a final card ("the river" or "fifth street"). Each player seeks the best five card poker hand from any combination of the seven cards of the five community cards and their two hole cards. Players have betting options to check, call, raise, or fold. Rounds of betting take place before the flop is dealt and after each subsequent deal. The player who has the best hand and has not folded by the end of all betting rounds wins all of the money bet for the hand, known as the pot.  
Deploying the game on the distributed network prevents the game from potentially being manipulated by the authority like a centralized server. The distributed network is transparent and every one can look into the smart contracts and see all transactions confirmed by the network. In this way, the fairness of the game is guaranteed.

# Deployment

```
# Clone the repository
git clone https://github.com/QiyangT/Texas-Holdem.git

# Go inside the directory
cd Texas-Holdem

# Install dependencies for backend
npm install

# Setup Texas_Holdem contract
truffle compile
truffle migrate

# Launch http-server with python
python -m http.server 8000

# Run the web application
start http://localhost:8000/src/HTML5/TexasHoldem.html
