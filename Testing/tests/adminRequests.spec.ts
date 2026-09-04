import { test, expect } from "@playwright/test";
import { AdminLogin, EmployeeSignUp } from "../helpers/login";
import { deleteUserByEmail } from "../helpers/dataAccessManager";
import { adminRequestsAccept, adminRequestsDecline, adminRequestsSearchValidation, adminRequestsValidation } from "helpers/requests";
import { globalData } from "helpers/global";

test.only("adminRequestsSearchValidation", async ({ context }) => {
    await deleteUserByEmail(globalData.email);

    await EmployeeSignUp(context);

    await adminRequestsSearchValidation(context);
});


test("adminRequestsValidation", async ({ context }) => {

    await deleteUserByEmail(globalData.email);
    await EmployeeSignUp(context);
    await adminRequestsValidation(context);
})

test("adminRequestsAccept", async ({ context }) => {

    await deleteUserByEmail(globalData.email);
    await EmployeeSignUp(context);
    await adminRequestsAccept(context);
})

test("adminRequestsDecline", async ({ context }) => {

    await deleteUserByEmail(globalData.email);
    await EmployeeSignUp(context);
    await adminRequestsDecline(context);

})