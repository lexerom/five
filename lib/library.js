import Card from './card.js';
import CardStorage from './card-storage.js';

export default class Library extends CardStorage{
    /**
     * Randomize cards order
     */
    shuffle () {
        let counter = this.cards.length, temp, index;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            temp = this.cards[counter];
            this.cards[counter] = this.cards[index];
            this.cards[index] = temp;
        }
    }

    /**
     *
     * @param {boolean} shuffle
     * @returns {Library}
     */
    static generateLibrary(shuffle) {
        const library = new Library();
        const cardTypes = Card.getAllTypes();
        for (let typeIndex in cardTypes) {
            for (let i = 1; i <= 10; i++) {
                library.putCard(Card.generate(cardTypes[typeIndex]));
            }
        }

        if (shuffle) {
            library.shuffle();
        }

        return library;
    }
}