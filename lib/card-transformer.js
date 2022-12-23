export default class CardTransformer {
    /**
     *
     * @param {Card} card
     */
    static transform(card) {
        return {
            id: card.id,
            type: card.type,
            image: card.image
        };
    }

    /**
     *
     * @param {CardStorage} storage
     */
    static transformStorage(storage) {
        const cards = [];

        for (const card of storage.getCards()) {
            cards.push(CardTransformer.transform(card));
        }

        return {cards: cards};
    }

    /**
     *
     * @param {StackCard} stackCard
     * @returns {{card: {image: string, id: string, type: number}, playerId: (string)}}
     */
    static transformStackCard(stackCard) {
        return {
            card: CardTransformer.transform(stackCard.card),
            playerId: stackCard.playerId
        }
    }
}