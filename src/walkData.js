// Scenes for the cabin walk-through: each class has one or more views you step through,
// each with tappable points (x/y are fractions of the photo).
import { IMG } from './data';

export const WALK = {
  flight: {
    economy: [
      { img: IMG.flight.economy, title: 'Economy cabin', spots: [
        { x: 0.5, y: 0.55, label: 'Centre aisle, wide enough for the trolley and you' },
        { x: 0.2, y: 0.62, label: 'Leather seats with adjustable winged headrests' },
        { x: 0.75, y: 0.18, label: 'Overhead bins fit a full-size cabin bag' },
      ] },
      { img: IMG.flight.economy2, title: 'Seatback entertainment', spots: [
        { x: 0.25, y: 0.45, label: '13-inch screen with 300+ films and live maps' },
        { x: 0.5, y: 0.08, label: 'Mood lighting shifts with the time zone' },
        { x: 0.78, y: 0.72, label: 'USB-C power under every seat' },
      ] },
    ],
    business: [
      { img: IMG.flight.business, title: 'Business pods', spots: [
        { x: 0.3, y: 0.62, label: 'Lie-flat bed, 78 inches long' },
        { x: 0.5, y: 0.75, label: 'Every pod has direct aisle access' },
        { x: 0.72, y: 0.48, label: 'Privacy divider and a plush pillow' },
      ] },
      { img: IMG.flight.lounge, title: 'Lounge bar', spots: [
        { x: 0.22, y: 0.62, label: 'Bar table with cocktails and small plates' },
        { x: 0.62, y: 0.62, label: 'Leather sofa corner for up to six guests' },
      ] },
    ],
    first: [
      { img: IMG.flight.first, title: 'First suites', spots: [
        { x: 0.35, y: 0.68, label: 'Private suite with a sliding door' },
        { x: 0.2, y: 0.42, label: '32-inch screen and noise-cancelling headphones' },
        { x: 0.62, y: 0.5, label: 'Turn-down bed with a mattress topper' },
      ] },
      { img: IMG.flight.lounge, title: 'Onboard lounge', spots: [
        { x: 0.22, y: 0.62, label: 'Dining table with champagne on ice' },
        { x: 0.62, y: 0.62, label: 'Sofa lounge, included with every suite' },
      ] },
    ],
  },
  bus: {
    standard: [
      { img: IMG.bus.standard, title: 'Standard coach', spots: [
        { x: 0.25, y: 0.6, label: 'Reclining seats with seatbelts' },
        { x: 0.5, y: 0.15, label: 'Climate control and reading lights' },
        { x: 0.55, y: 0.7, label: 'Charging port at every row' },
      ] },
      { img: IMG.bus.classic, title: 'Front of the coach', spots: [
        { x: 0.3, y: 0.65, label: 'Two-tone leather seats' },
        { x: 0.55, y: 0.75, label: 'Wood-finish aisle floor' },
      ] },
    ],
    executive: [
      { img: IMG.bus.executive, title: 'Executive coach', spots: [
        { x: 0.25, y: 0.7, label: 'Quilted leather recliners in a 2+1 layout' },
        { x: 0.5, y: 0.12, label: 'Ambient LED lighting' },
        { x: 0.55, y: 0.85, label: 'Wide aisle, easy to stretch your legs' },
      ] },
      { img: IMG.bus.executive2, title: 'Work table seats', spots: [
        { x: 0.2, y: 0.7, label: 'Fold-out table for laptops and meals' },
        { x: 0.6, y: 0.55, label: 'Extra legroom between rows' },
      ] },
    ],
    royal: [
      { img: IMG.bus.royal, title: 'Royal Lounge', spots: [
        { x: 0.35, y: 0.72, label: 'Captain recliners with leg rests' },
        { x: 0.5, y: 0.2, label: 'Starlight ceiling' },
        { x: 0.5, y: 0.45, label: 'Front screen for films on the road' },
      ] },
      { img: IMG.bus.vip, title: 'Private lounge cabin', spots: [
        { x: 0.2, y: 0.6, label: 'L-shaped sofas for up to eight guests' },
        { x: 0.5, y: 0.1, label: 'Mood lighting and a sound system' },
      ] },
    ],
  },
  train: {
    economy: [
      { img: IMG.train.economy, title: 'Economy coach', spots: [
        { x: 0.75, y: 0.6, label: 'Reclining seats with a fold-down armrest' },
        { x: 0.5, y: 0.15, label: 'Bright, quiet cabin with climate control' },
        { x: 0.45, y: 0.7, label: 'Power socket at every pair of seats' },
      ] },
      { img: IMG.train.economy2, title: 'Table bays', spots: [
        { x: 0.8, y: 0.7, label: 'Four seats around a shared table' },
        { x: 0.3, y: 0.16, label: 'Luggage racks above every bay' },
      ] },
    ],
    business: [
      { img: IMG.train.business, title: 'Business coach', spots: [
        { x: 0.7, y: 0.65, label: 'Two-tone leather armchairs in a 2+1 layout' },
        { x: 0.45, y: 0.75, label: 'Wood-finish floor in the quiet coach' },
      ] },
      { img: IMG.train.business2, title: 'Night service', spots: [
        { x: 0.75, y: 0.7, label: 'Quilted recliners for overnight routes' },
        { x: 0.5, y: 0.12, label: 'Dimmed blue lighting after 10 pm' },
        { x: 0.45, y: 0.85, label: 'Wide aisle for the trolley service' },
      ] },
    ],
    first: [
      { img: IMG.train.first, title: 'First class', spots: [
        { x: 0.65, y: 0.68, label: '1+1 recliners with a privacy screen' },
        { x: 0.8, y: 0.42, label: 'Personal screen and noise-cancelling headphones' },
        { x: 0.38, y: 0.5, label: 'Seats recline almost flat' },
      ] },
      { img: IMG.train.first2, title: 'Lounge and dining car', spots: [
        { x: 0.78, y: 0.62, label: 'Dining tables with a three-course menu' },
        { x: 0.38, y: 0.62, label: 'Sofa lounge for First class guests' },
      ] },
    ],
  },
};
