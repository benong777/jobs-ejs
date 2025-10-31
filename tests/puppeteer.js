const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../utils/seed_db");
const Job = require("../models/Job");

let testUser = null;

let page = null;
let browser = null;
// Launch the browser and open a new blank page
describe("jobs-ejs puppeteer test", function () {
  before(async function () {
    this.timeout(10000);
    //await sleeper(5000)
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });
  after(async function () {
    this.timeout(5000);
    await browser.close();
  });
  describe("got to site", function () {
    it("should have completed a connection", async function () {});
  });
  describe("index page test", function () {
    this.timeout(10000);
    it("finds the index page logon link", async () => {
      this.logonLink = await page.waitForSelector(
        "a ::-p-text(Click this link to logon)",
      );
    });
    it("gets to the logon page", async () => {
      await this.logonLink.click();
      await page.waitForNavigation();
      const email = await page.waitForSelector('input[name="email"]');
    });
  });
  describe("logon page test", function () {
    this.timeout(20000);
    it("resolves all the fields", async () => {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button ::-p-text(Logon)");
    });
    it("sends the logon", async () => {
      testUser = await seed_db();
      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();
      await page.waitForNavigation();
      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector("a ::-p-text(change the secret)");
      await page.waitForSelector('a[href="/secretWord"]');
      const copyr = await page.waitForSelector("p ::-p-text(copyright)");
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log("copyright text: ", copyrText);
    });
  });

  describe("puppeteer job operations", function () {
    this.timeout(40000);

    it("should navigate to jobs list and verify 20 entries", async () => {
      const { expect } = await import("chai");

      const jobsLink = await page.waitForSelector('a[href="/jobs"]');
      await jobsLink.click();
      await page.waitForNavigation();

      const content = await page.content();
      const rows = content.split("<tr>");
      expect(rows.length).to.equal(21);
    });

    it("should open 'Add Job' form and verify fields and button", async () => {
      const { expect } = await import("chai");

      const addJobButton = await page.waitForSelector('a[href="/jobs/new"] > button');
      await addJobButton.click();

      await page.waitForSelector('form');

      const companyInput = await page.waitForSelector('input#company');
      const positionInput = await page.waitForSelector('input#position');
      const addButton = await page.waitForSelector('form button[type="submit"]');

      expect(companyInput).to.exist;
      expect(positionInput).to.exist;
      expect(addButton).to.exist;
    });

    it("should add a new job and verify success message and DB entry", async () => {
      const { expect } = await import("chai");

      const testCompany = "Example Company";
      const testPosition = "Example Position";

      const companyInput = await page.waitForSelector('input#company');
      const positionInput = await page.waitForSelector('input#position');
      const addButton = await page.waitForSelector('form button[type="submit"]');

      await companyInput.type(testCompany);
      await positionInput.type(testPosition);

      await Promise.all([
        page.waitForNavigation(),
        addButton.click()
      ]);

      const content = await page.content();
      expect(content.toLowerCase()).to.include("job added");

      // Check MongoDB that the last job entry matches
      const jobs = await Job.find().sort({ createdAt: -1 }).limit(1);
      expect(jobs).to.have.lengthOf(1);
      expect(jobs[0].company).to.equal(testCompany);
      expect(jobs[0].position).to.equal(testPosition);
    });
  });
});