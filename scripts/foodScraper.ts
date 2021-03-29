import got from "got";
import dotenv from "dotenv";
import { Firestore, FieldValue } from "@google-cloud/firestore";

dotenv.config();

const config = process.env;

const firestore = new Firestore();

const foodScraper = async () => {
  let request = await got(`${config.ISU_DINING_API_ENDPOINT}/get-locations/`);
  const locations = JSON.parse(request.body);

  locations.map(async (location) => {
    request = await got(
      `${config.ISU_DINING_API_ENDPOINT}get-single-location/?slug=${location.slug}`
    );
    const locationDetails = JSON.parse(request.body)[0];

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
      const foodItemRef = firestore.collection("food-items").doc(item.name);
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
};

const parseFoodItem = (item) => ({
  ...item,
  totalCal: parseInt(item.totalCal),
  isHalal: item.isHalal == "1",
  isVegetarian: item.isVegetarian == "1",
  isVegan: item.isVegan == "1",
  traits: JSON.parse(item.traits),
});

export default foodScraper;
