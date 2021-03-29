const got = require("got");
const dotenv = require("dotenv");
const { Firestore, FieldValue } = require("@google-cloud/firestore");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

dotenv.config();

const config = process.env;

const firestore = new Firestore();

exports.foodScraper = functions.https.onRequest(async (request, response) => {
  let isuApiRequest;
  try {
    isuApiRequest = await got(
      `${config.ISU_DINING_API_ENDPOINT}get-locations/`
    );
  } catch (e) {
    console.error(e);
    return response.status(500).json({
      status: "error",
      message: "Failed to fetch ISU Dining locations.",
    });
  }
  const locations = JSON.parse(isuApiRequest.body);

  locations.map(async (location) => {
    try {
      isuApiRequest = await got(
        `${config.ISU_DINING_API_ENDPOINT}get-single-location/?slug=${location.slug}`
      );
    } catch (e) {
      console.error(`Failed to fetch ${location.title} location details.`);
    }
    const locationDetails = JSON.parse(isuApiRequest.body)[0];

    const foodItems = [];
    locationDetails.menus.map((menu) => {
      menu.menuDisplays.map((display) => {
        display.categories.map((category) => {
          category.menuItems.map((menuItem) => {
            const parsedFoodItem = parseFoodItem(menuItem);
            if (foodItems.includes(parseFoodItem)) return;
            foodItems.push(parsedFoodItem);
          });
        });
      });
    });

    foodItems.map(async (item) => {
      const key = item.name.replace(/\W/g, "");
      const foodItemRef = firestore.collection("food-items").doc(key);
      const docSnapshot = await foodItemRef.get();

      if (docSnapshot.exists) {
        await foodItemRef.update({
          occurrences: FieldValue.increment(1),
        });
        console.log(`Incremented ${item.name} occurrences by 1.`);
      } else {
        await foodItemRef.set({ ...item, occurrences: 1 });
        console.log(`Created food: ${item.name}`);
      }
    });
  });
});

const parseFoodItem = (item) => ({
  ...item,
  totalCal: parseInt(item.totalCal),
  isHalal: item.isHalal == "1",
  isVegetarian: item.isVegetarian == "1",
  isVegan: item.isVegan == "1",
  traits: JSON.parse(item.traits),
});
