import { expect, BrowserContext } from "@playwright/test";
import { AdminLogin } from "./login";
import { globalData } from "./global";

export async function adminRequestsValidation(context: BrowserContext) {
  const page = await context.newPage();

  try {
    await AdminLogin(page);

    await page.getByRole('link', { name: 'Pending Requests' }).click();

    await page
      .getByRole('textbox', { name: 'Search by name, email...' })
      .fill(globalData.email!);

    await expect(page.locator('tbody')).toContainText(globalData.fullname!);
    await expect(page.locator('tbody')).toContainText(globalData.role!);
    await expect(page.locator('tbody')).toContainText(globalData.email!);
    await expect(page.locator('tbody')).toContainText(globalData.mobile!);
    await expect(page.locator('tbody')).toContainText(globalData.designation!);
    await expect(page.locator('tbody')).toContainText(globalData.department!);

    await page.getByRole('button', { name: 'View Details' }).click();

    const details = page.getByLabel('User Registration Details');

    await expect(details).toContainText(globalData.fullname!);
    await expect(details).toContainText(globalData.email!);
    await expect(details).toContainText(globalData.role!);
    await expect(details).toContainText(globalData.mobile!);
    await expect(details).toContainText(globalData.designation!);
    await expect(details).toContainText(globalData.department!);

    await expect(
      page.getByRole('button', { name: 'Reject' })
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Approve' })
    ).toBeVisible();

  } finally {
    await page.close();
  }
}


export async function adminRequestsDecline(context: BrowserContext) {
  const page = await context.newPage();

  try {
    await AdminLogin(page);

    await page.getByRole('link', { name: 'Pending Requests' }).click();

    await page
      .getByRole('textbox', { name: 'Search by name, email...' })
      .fill(globalData.email!);

    await page.getByRole('button', { name: 'View Details' }).click();

    await page.getByRole('button', { name: 'Reject' }).click();

    await page.getByTitle('Logout', { exact: true }).click();

    await page.locator("#SignInEmail").fill(globalData.email!);
    await page.locator("#SignInPassword").fill('1234');
    await page.locator('#signInBTN').click();

    await expect(
      page.getByText(
        'You are rejected, please contact your HR',
        { exact: true }
      )
    ).toBeVisible();

  } finally {
    await page.close();
  }
}


export async function adminRequestsAccept(context: BrowserContext) {
  const page = await context.newPage();

  try {
    await AdminLogin(page);

    await page.getByRole('link', { name: 'Pending Requests' }).click();

    await page
      .getByRole('textbox', { name: 'Search by name, email...' })
      .fill(globalData.email!);

    await page.getByRole('button', { name: 'View Details' }).click();

    await page.getByRole('button', { name: 'Approve' }).click();

    await page.getByTitle('Logout', { exact: true }).click();

    await page.locator("#SignInEmail").fill(globalData.email!);
    await page.locator("#SignInPassword").fill('1234');
    await page.locator('#signInBTN').click();

    await expect(
      page.getByText(
        `Welcome, ${globalData.fullname} !`,
        { exact: true }
      )
    ).toBeVisible();

  } finally {
    await page.close();
  }
}


export async function adminRequestsSearchValidation(
  context: BrowserContext
) {
  const page = await context.newPage();

  try {
    await AdminLogin(page);

    await page.getByRole('link', { name: 'Pending Requests' }).click();

    const searchBox = page.getByRole('textbox', { name: 'Search by name, email...' });

    await searchBox.fill(globalData.email!);
    await expect(page.getByText(globalData.email!, { exact: true })).toBeVisible();

    // page.getByText('chaitanya123@gmail.com', { exact: true })

    await page.pause();
    await searchBox.fill(globalData.fullname!);
    await expect(page.getByText(globalData.fullname!, { exact: true })).toBeVisible();

    

    await searchBox.fill(globalData.mobile!);
    await expect(page.getByText(globalData.mobile!, { exact: true })).toBeVisible();

  } finally {
    await page.close();
  }
}
