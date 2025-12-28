# Deck of cards

Help me create an app to help me with my games. Is a deck of cards app, where I can register JSON files that contain an array of items, and randomly select one item of the array.

The app should simulate a deck of cards, and the randomly choice of a card, with the option to always drawn from the entire deck or keep track of the cards already drawn.

For start the tables file should be like:

```json
{
  "name": "name of the deck",
  "coverImage": "",
  "options": [
    {"title":"","description":"", "image":""},
    {"title":"","description":"", "image":""}
  ]
}
```

With the only required field being `name`, `options` and `title`.
The `coverImage` field when present, should contain the url of an image to be displayed in the deck selection screen.
The `image` field when present, should contain the url of an image to be displayed when that card is choosen.

But must be versatile enough to allow future expansion with more fields for each possible value.

The app will be hosted in github pages, must be developed in plain javascript, and should work as a PWA to allow offline installation in mobile devices. No need to overengieening it, just make modular enough to easy maintance.

## Design

The main screen should shown the all the decks available, with a button to the deck management screen

After selecting a deck, the user is shown a blank screen with a button to draw a card, a button to shuffle and a checkbox "always shuffle" (which allow to the same card be draw multiple times in this session)

It should have a screen for the user manage the tables/decks, allowing them to import a new deck from a file or url or remove existing decks.

Use a beautiful, serif font and a coesive color palete to give a fantasy flavor.

---

The concept is clear? Can you understand the usefulness of it for prototyping my game ideas?
