import { Selector, t } from 'testcafe';

fixture('DNI Registration Flow - End to End Test')
    .page('http://localhost:5000')
    .beforeEach(async t => {
        // Clear any existing data and start fresh
        await t.eval(() => localStorage.clear());
        await t.eval(() => sessionStorage.clear());
    });

test('Complete DNI Registration Flow', async t => {
    // Step 1: Navigate to registration page and select dates
    await t
        .expect(Selector('h1').withText('Pilgrim Registration').exists).ok('Registration page loaded')
        .click(Selector('input[type="date"]').nth(0)) // Check-in date
        .typeText(Selector('input[type="date"]').nth(0), '2025-07-25')
        .click(Selector('input[type="date"]').nth(1)) // Check-out date  
        .typeText(Selector('input[type="date"]').nth(1), '2025-07-26')
        .click(Selector('button').withText('Check Availability'));

    // Wait for availability check
    await t.expect(Selector('.availability-result').exists).ok('Availability check completed', { timeout: 10000 });

    // Step 2: Upload DNI document
    const dniFileInput = Selector('input[type="file"]').withAttribute('accept', 'image/*');
    await t
        .expect(dniFileInput.exists).ok('File upload input found')
        .setFilesToUpload(dniFileInput, ['../attached_assets/dni-españa-informatizado-1024x669_1753385962506.jpg']);

    // Wait for OCR processing
    await t
        .expect(Selector('.ocr-processing').exists).ok('OCR processing started', { timeout: 5000 })
        .expect(Selector('.ocr-processing').exists).notOk('OCR processing completed', { timeout: 30000 });

    // Step 3: Verify OCR data extraction
    const firstNameField = Selector('input[name="firstName"]');
    const lastNameField = Selector('input[name="lastName1"]');
    const documentNumberField = Selector('input[name="documentNumber"]');
    const birthDateField = Selector('input[name="birthDate"]');

    await t
        .expect(firstNameField.value).notEql('', 'First name extracted from DNI')
        .expect(lastNameField.value).notEql('', 'Last name extracted from DNI')
        .expect(documentNumberField.value).match(/^\d{8}[A-Z]$/, 'Valid DNI number format')
        .expect(birthDateField.value).match(/^\d{4}-\d{2}-\d{2}$/, 'Birth date in correct format');

    // Step 4: Complete personal information
    const emailField = Selector('input[name="email"]');
    const phoneField = Selector('input[name="phone"]');
    const addressField = Selector('input[name="address"]');

    await t
        .typeText(emailField, 'pilgrim@test.com', { replace: true })
        .typeText(phoneField, '+34612345678', { replace: true })
        .typeText(addressField, 'Calle Test 123, Madrid, Spain', { replace: true });

    // Step 5: Select accommodation type
    const dormitoryOption = Selector('input[type="radio"][value="dormitory"]');
    await t
        .click(dormitoryOption)
        .expect(dormitoryOption.checked).ok('Dormitory accommodation selected');

    // Step 6: Review booking details
    const bookingSummary = Selector('.booking-summary');
    await t
        .expect(bookingSummary.exists).ok('Booking summary displayed')
        .expect(bookingSummary.innerText).contains('€15', 'Correct dormitory price shown')
        .expect(bookingSummary.innerText).contains('2025-07-25', 'Check-in date displayed')
        .expect(bookingSummary.innerText).contains('2025-07-26', 'Check-out date displayed');

    // Step 7: Proceed to payment
    const proceedToPaymentBtn = Selector('button').withText('Proceed to Payment');
    await t
        .click(proceedToPaymentBtn)
        .expect(Selector('.payment-form').exists).ok('Payment form displayed', { timeout: 10000 });

    // Step 8: Fill payment information
    const cardNumberField = Selector('input[name="cardNumber"]');
    const expiryField = Selector('input[name="expiryDate"]');
    const cvvField = Selector('input[name="cvv"]');
    const cardholderField = Selector('input[name="cardholder"]');

    await t
        .typeText(cardNumberField, '4242424242424242') // Test card number
        .typeText(expiryField, '12/28')
        .typeText(cvvField, '123')
        .typeText(cardholderField, 'Test Pilgrim');

    // Step 9: Submit payment
    const submitPaymentBtn = Selector('button').withText('Complete Payment');
    await t
        .click(submitPaymentBtn)
        .expect(Selector('.payment-processing').exists).ok('Payment processing started', { timeout: 5000 });

    // Step 10: Verify successful registration
    await t
        .expect(Selector('.registration-success').exists).ok('Registration completed successfully', { timeout: 15000 })
        .expect(Selector('.booking-confirmation').exists).ok('Booking confirmation displayed')
        .expect(Selector('.bed-assignment').exists).ok('Bed assignment completed');

    // Step 11: Verify booking details in confirmation
    const confirmationDetails = Selector('.booking-confirmation');
    await t
        .expect(confirmationDetails.innerText).contains('DNI', 'Document type confirmed')
        .expect(confirmationDetails.innerText).contains('dormitory', 'Accommodation type confirmed')
        .expect(confirmationDetails.innerText).contains('€15', 'Payment amount confirmed')
        .expect(confirmationDetails.innerText).match(/Bed [A-B]\d{1,2}/, 'Bed assignment confirmed');

    // Step 12: Verify government submission
    const governmentSubmission = Selector('.government-submission-status');
    await t
        .expect(governmentSubmission.exists).ok('Government submission status displayed')
        .expect(governmentSubmission.innerText).contains('submitted', 'Government submission completed');

    // Step 13: Test admin dashboard update
    await t
        .navigateTo('http://localhost:5000/admin')
        .typeText(Selector('input[name="username"]'), 'admin')
        .typeText(Selector('input[name="password"]'), 'admin123')
        .click(Selector('button[type="submit"]'));

    // Verify booking appears in admin dashboard
    await t
        .expect(Selector('.admin-dashboard').exists).ok('Admin dashboard loaded')
        .expect(Selector('.recent-bookings').innerText).contains('DNI', 'New booking visible in admin')
        .expect(Selector('.occupancy-stats .occupied').innerText).eql('1', 'Occupancy count updated');

    console.log('✅ Complete DNI registration flow test passed successfully');
});

test('DNI Document Validation', async t => {
    // Test invalid DNI format rejection
    await t
        .navigateTo('http://localhost:5000')
        .click(Selector('input[type="date"]').nth(0))
        .typeText(Selector('input[type="date"]').nth(0), '2025-07-25')
        .click(Selector('input[type="date"]').nth(1))
        .typeText(Selector('input[type="date"]').nth(1), '2025-07-26')
        .click(Selector('button').withText('Check Availability'));

    // Upload invalid document
    const fileInput = Selector('input[type="file"]');
    await t.setFilesToUpload(fileInput, ['../attached_assets/image_1752773875306.png']); // Non-DNI image

    // Wait for processing and check error handling
    await t
        .expect(Selector('.ocr-error').exists).ok('OCR error handling displayed', { timeout: 30000 })
        .expect(Selector('.validation-error').innerText).contains('DNI', 'DNI validation error shown');

    console.log('✅ DNI document validation test passed');
});

test('DNI Checksum Validation', async t => {
    // Test with manually entered DNI to verify checksum validation
    await t
        .navigateTo('http://localhost:5000')
        .click(Selector('input[type="date"]').nth(0))
        .typeText(Selector('input[type="date"]').nth(0), '2025-07-25')
        .click(Selector('input[type="date"]').nth(1))
        .typeText(Selector('input[type="date"]').nth(1), '2025-07-26')
        .click(Selector('button').withText('Check Availability'));

    // Skip file upload and manually enter DNI
    const skipUploadBtn = Selector('button').withText('Enter Manually');
    if (await skipUploadBtn.exists) {
        await t.click(skipUploadBtn);
    }

    // Enter invalid DNI with wrong checksum
    const documentNumberField = Selector('input[name="documentNumber"]');
    await t
        .typeText(documentNumberField, '12345678A') // Invalid checksum
        .click(Selector('button').withText('Validate'));

    // Verify checksum validation error
    await t
        .expect(Selector('.validation-error').exists).ok('Validation error displayed')
        .expect(Selector('.validation-error').innerText).contains('checksum', 'Checksum error shown');

    // Enter valid DNI
    await t
        .selectText(documentNumberField)
        .typeText(documentNumberField, '12345678Z') // Valid checksum
        .click(Selector('button').withText('Validate'));

    // Verify validation passes
    await t
        .expect(Selector('.validation-success').exists).ok('Validation success displayed')
        .expect(Selector('.validation-error').exists).notOk('No validation errors');

    console.log('✅ DNI checksum validation test passed');
});

test('Bed Assignment and Reservation Management', async t => {
    // Complete a registration to test bed assignment
    await t
        .navigateTo('http://localhost:5000')
        .click(Selector('input[type="date"]').nth(0))
        .typeText(Selector('input[type="date"]').nth(0), '2025-07-25')
        .click(Selector('input[type="date"]').nth(1))
        .typeText(Selector('input[type="date"]').nth(1), '2025-07-26')
        .click(Selector('button').withText('Check Availability'));

    // Upload DNI and complete registration
    const fileInput = Selector('input[type="file"]');
    await t
        .setFilesToUpload(fileInput, ['../attached_assets/dni-españa-informatizado-1024x669_1753385962506.jpg'])
        .wait(20000); // Wait for OCR processing

    // Fill required fields
    await t
        .typeText(Selector('input[name="email"]'), 'test2@pilgrim.com', { replace: true })
        .typeText(Selector('input[name="phone"]'), '+34612345679', { replace: true })
        .click(Selector('input[value="dormitory"]'))
        .click(Selector('button').withText('Proceed to Payment'));

    // Complete payment
    await t
        .typeText(Selector('input[name="cardNumber"]'), '4242424242424242')
        .typeText(Selector('input[name="expiryDate"]'), '12/28')
        .typeText(Selector('input[name="cvv"]'), '123')
        .typeText(Selector('input[name="cardholder"]'), 'Test Pilgrim 2')
        .click(Selector('button').withText('Complete Payment'));

    // Verify bed assignment
    await t
        .expect(Selector('.bed-assignment').exists).ok('Bed assignment completed', { timeout: 15000 })
        .expect(Selector('.bed-assignment').innerText).match(/Bed [A-B]\d{1,2}/, 'Valid bed assignment format');

    // Test reservation timeout (would require extended test time)
    console.log('✅ Bed assignment test passed');
});

// Configuration for TestCafe run
export const testCafeConfig = {
    browsers: ['chrome:headless'],
    src: ['tests/dni-registration-flow.js'],
    reporter: ['spec', 'json:reports/test-results.json'],
    screenshots: {
        path: 'screenshots/',
        takeOnFails: true,
        pathPattern: '${DATE}_${TIME}/test-${TEST_INDEX}/${USERAGENT}/${FILE_INDEX}.png'
    },
    videoPath: 'videos/',
    videoOptions: {
        singleFile: true,
        failedOnly: false
    },
    speed: 0.8,
    stopOnFirstFail: false,
    skipJsErrors: true,
    assertionTimeout: 30000,
    pageLoadTimeout: 30000,
    concurrency: 1
};