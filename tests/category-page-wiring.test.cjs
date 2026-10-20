const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('category directory is routed and each category card opens the filtered shop', () => {
  const app = read('src/App.tsx');
  const directory = read('src/screens/CategoriesScreen.tsx');
  const home = read('src/screens/IntroScreen.tsx');
  const navbar = read('src/components/Navbar.tsx');
  const mobileNav = read('src/components/MobileBottomNav.tsx');

  assert.match(app, /categories:\s*'\/categories'/);
  assert.match(app, /currentScreen === 'categories' && <CategoriesScreen/);
  assert.match(directory, /useCategories\(\)/);
  assert.match(directory, /useProducts\(\)/);
  assert.match(directory, /productCount:\s*matchingProducts\.length/);
  assert.match(directory, /setShopIntent\(\{ type: 'category', value: categoryName \}\)/);
  assert.match(directory, /onNavigate\('products'\)/);
  assert.match(home, /onNavigate\('categories'\)/);
  assert.match(navbar, /onClick=\{\(\) => handleNav\('categories'\)\}/);
  assert.match(mobileNav, /setCurrentScreen\('categories'\)/);
});
