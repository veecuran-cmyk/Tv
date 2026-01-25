// servidor.js: Configuração do Firebase e referências Globais

const firebaseConfig = {
  apiKey: "AIzaSyD9zO9nW9NCDbucBcwwHBej9saZU9Mrw6c",
  authDomain: "servidor-e2453.firebaseapp.com",
  databaseURL: "https://servidor-e2453-default-rtdb.firebaseio.com",
  projectId: "servidor-e2453",
  storageBucket: "servidor-e2453.firebasestorage.app",
  messagingSenderId: "888960994601",
  appId: "1:888960994601:web:0417a852edfcb9f0393b38",
  measurementId: "G-20JLMYB7VV"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Definindo referências globais para serem acessadas por outros arquivos .js
window.playersRef = db.ref('players');
window.gameStateRef = db.ref('game_state');
window.chatRef = db.ref('chat');
window.flowersRef = db.ref('flowers'); // Adicionado para a lógica de visão

// Monitoramento de Conexão
db.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === true && typeof playerName !== 'undefined' && playerName) {
        // Se o player cair, remove ele do banco automaticamente
        playersRef.child(playerName).onDisconnect().remove();
        chatRef.onDisconnect().push(`[SISTEMA] ${playerName} perdeu a conexão.`);
    }
});

// Inicialização do Estado do Jogo (Apenas se o banco estiver vazio)
gameStateRef.once('value').then(snap => {
    if (!snap.val()) {
        gameStateRef.set({
            towers: {
                'Mid': {'aliada': 3, 'inimiga': 3},
                'Solo': {'aliada': 3, 'inimiga': 3},
                'Duo': {'aliada': 3, 'inimiga': 3}
            },
            nucleo_hp: 1000,
            minions: {Mid: 0, Solo: 0, Duo: 0},
            bosses: [
                {location: 'Jungle:Boss1', hp: 500, max_hp: 500}, 
                {location: 'Jungle:Boss2', hp: 500, max_hp: 500}
            ]
        });
    }
});
