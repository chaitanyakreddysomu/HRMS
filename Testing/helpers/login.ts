import { test, expect, BrowserContext, Page } from '@playwright/test';
import { globalData } from './global';

export async function AdminLogin(page:Page) {


    await page.goto(process.env.BASE_URL!);
    await page.waitForLoadState('domcontentloaded');

    await page.locator("#SignInEmail").fill(process.env.ADMIN_EMAIL!);
    await page.locator("#SignInPassword").fill(process.env.ADMIN_PASSWORD!);
    await page.locator('#signInBTN').click();


}

export async function EmployeeLogin(page:Page) {


    await page.goto(process.env.BASE_URL!);
    await page.waitForLoadState('domcontentloaded');

    await page.locator("#SignInEmail").fill(process.env.EMPLOYEE_EMAIL!);
    await page.locator("#SignInPassword").fill(process.env.EMPLOYEE_PASSWORD!);
    await page.locator('#signInBTN').click();


}

export async function HRLogin(page:Page) {


    await page.goto(process.env.BASE_URL!);
    await page.waitForLoadState('domcontentloaded');

    await page.locator("#SignInEmail").fill(process.env.HR_EMAIL!);
    await page.locator("#SignInPassword").fill(process.env.HR_PASSWORD!);
    await page.locator('#signInBTN').click();

}



export async function EmployeeSignUp(context: BrowserContext) {
  const page = await context.newPage();

  try {
    await page.goto(process.env.BASE_URL!);

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await page
      .getByRole('textbox', { name: 'Full Name *' })
      .fill(globalData.fullname!);

    await page
      .locator('#SignUpEmail')
      .fill(globalData.email!);

    await page
      .getByRole('textbox', { name: 'Phone *' })
      .fill(globalData.mobile!);

    await page
      .getByRole('textbox', { name: 'Designation *' })
      .fill(globalData.designation!);

    await page
      .locator('select[name="department"]')
      .selectOption(globalData.department!);

    await page.locator('#SignUpPassword').fill('1234');
    await page.locator('#SignUpConfirmPassword').fill('1234');

    await page
      .getByRole('button', { name: 'Create Account' })
      .click();

    await page.locator('#SignInEmail').fill(globalData.email!);
    await page.locator('#SignInPassword').fill('1234');
    await page.locator('#signInBTN').click();

    await expect(page.locator('#loginErrorMsg'))
      .toContainText('You are not approved, please contact HR');

  } finally {
    await page.close();
  }
}

