import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import RobberyMarkerIcon from "./RobberyMarkerIcon";

test("icons match marker or display names regardless of case and separators", () => {
  for (const [markerName, name, file] of [
    ["MoneyTruck", "Bank Truck", "Money_Truck.png"],
    ["Casino", "Crown Jewel", "Crown_Jewel.png"],
    ["Grocery", "Grocery Store", "Grocery_Store.png"],
    ["cargo-plane", "Cargo Plane", "Cargo_Plane.png"],
    ["POWER_PLANT", "Power Plant", "PowerPlant.png"],
  ]) {
    const markup = renderToStaticMarkup(
      <RobberyMarkerIcon
        markerName={markerName}
        name={name}
        className="size-6"
      />,
    );
    expect(markup).toContain(`/robbery_icons/${file}`);
    expect(markup).toContain('aria-hidden="true"');
  }
  expect(
    renderToStaticMarkup(
      <RobberyMarkerIcon
        markerName="Unknown"
        name="Missing"
        className="size-6"
      />,
    ),
  ).toBe("");
});
