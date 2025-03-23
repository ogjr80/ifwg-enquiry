import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './EnquiryWebPart.module.scss';
import * as strings from 'EnquiryWebPartStrings';

export interface IEnquiryWebPartProps {
  formTitle: string;
  submitButtonText: string;
  thankYouMessage: string;
  faqPageUrl: string;
  submissionListName: string;
  documentLibraryName: string;
  notificationEmail: string;
  adminGroupName: string;
}

// Country list for dropdown
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", 
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", 
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", 
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", 
  "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", 
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", 
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", 
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", 
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", 
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", 
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", 
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", 
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", 
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Global Presence"
];

// Constants for the form
const REGULATORS = [
  "Financial Conduct Authority (FCA)",
  "Prudential Regulation Authority (PRA)",
  "Financial Policy Committee (FPC)",
  "Payment Systems Regulator (PSR)",
  "Information Commissioner's Office (ICO)",
  "Advertising Standards Authority (ASA)",
  "Competition and Markets Authority (CMA)",
  "Other"
];

const CATEGORIES = {
  'banking': [
    'Digital/Neo-bank',
    'Business/Corporate Banking',
    'Retail Banking',
    'Private Banking',
    'Investment Banking',
    'Commercial Banking',
    'Core Banking Technology',
    'Other'
  ],
  'payments': [
    'Payment Institution',
    'E-money Institution',
    'Money Transfer',
    'Acquiring Services',
    'Card Issuance',
    'Digital Wallet',
    'Open Banking Solutions',
    'Other'
  ],
  'insurance': [
    'Life Insurance',
    'General Insurance',
    'Health Insurance',
    'Parametric Insurance',
    'Insurance Brokering',
    'Other'
  ],
  'crypto': [
    'Exchange',
    'Wallet Provider',
    'Stablecoin',
    'Decentralized Finance (DeFi)',
    'Crypto Lending/Borrowing',
    'NFT Marketplace',
    'Other'
  ],
  'investment': [
    'Wealth Management',
    'Robo-advisory',
    'Crowd-funding',
    'P2P Lending',
    'Asset Management',
    'Other'
  ],
  'credit': [
    'Lending',
    'Buy Now Pay Later',
    'Credit Scoring',
    'Credit Reference',
    'Debt Management',
    'Other'
  ],
  'notOperational': [
    'Pre-launch Product/Service',
    'Research and Development',
    'Early-stage Product/Service',
    'Other'
  ]
};

export default class EnquiryWebPart extends BaseClientSideWebPart<IEnquiryWebPartProps> {

  private currentStep: number = 1;
  private formData: any = {
    // Basic Information
    fullName: '',
    organisationName: '',
    contactNumber: '',
    emailAddress: '',
    websiteAddress: '',
    operationLocation: '',
    countriesOfOperation: [],
    operationLength: '',
    
    // Industry Information
    primaryBusinessAreas: '',
    productServiceCategory: '',
    otherProductServiceCategory: '',
    operationalStatus: null,
    regulatoryStatus: null,
    regulators: [],
    otherRegulator: '',
    
    // Enquiry Details
    productServiceDescription: '',
    questions: [''],
    additionalInformation: '',
    faqConfirmation: null,
    consentConfirmation: false,
    
    // Attachments
    files: []
  };

  // Number of questions currently shown (starts with 1)
  private questionCount: number = 1;
  
  // File upload references
  private fileUploadElement: HTMLInputElement = null;
  private uploadedFiles: File[] = [];
  
  // Validation flag
  private validateAttempted: boolean = false;

  public render(): void {
    this.domElement.innerHTML = `
      <div class="${ styles.enquiry }">
        <div class="${ styles.container }">
          <div class="${ styles.header }">
            <h2 class="${ styles.title }">Regulatory Guidance Unit Enquiry Form</h2>
            <div class="${ styles.introText }">
              <p>The Regulatory Guidance Unit provides informal, non-binding steers to persons seeking direction and clarity in navigating aspects of the FinTech regulatory landscape. It relies on the expertise of representatives from across participating regulators within the IFWG to ensure that guidance is holistic, inclusive and well considered. The functions of the Regulatory Guidance Unit include the following:</p>
              <ul>
                <li>To provide innovators with efficient and effective access to regulatory expertise potentially reducing their time needed to resolve regulatory concerns, increasing their speed to market and lowering their legal fees.</li>
                <li>To impart guidance and insight to entities seeking to operate and innovate in the market.</li>
                <li>To improve regulatory compliance through clear articulation of regulatory frameworks and reduce regulatory arbitrage.</li>
                <li>To enhance regulator understanding of innovation in the market.</li>
              </ul>
              <p>All information provided below will be kept confidential in accordance with the Protection of Personal Information Act, 2013, and the IFWG Privacy Policy.</p>
              <p>Please ensure you have consulted the <a href="${escape(this.properties.faqPageUrl || '#')}" target="_blank">FAQs page</a> before submitting an enquiry. <strong>All enquiries that relate to, and are addressed by, the FAQs will be referred to the FAQs page.</strong></p>
              <p><em>* Mandatory fields</em></p>
            </div>
            <div class="${ styles.progressContainer }">
              <div class="${ styles.progressBar }">
                <div class="${ styles.progress }" style="width: ${(this.currentStep - 1) * 50}%"></div>
              </div>
              <div class="${ styles.steps }">
                <div class="${ styles.step } ${this.currentStep >= 1 ? styles.active : ''}">
                  <div class="${ styles.stepNumber }">1</div>
                  <div class="${ styles.stepLabel }">Basic Information</div>
                </div>
                <div class="${ styles.step } ${this.currentStep >= 2 ? styles.active : ''}">
                  <div class="${ styles.stepNumber }">2</div>
                  <div class="${ styles.stepLabel }">Industry Information</div>
                </div>
                <div class="${ styles.step } ${this.currentStep >= 3 ? styles.active : ''}">
                  <div class="${ styles.stepNumber }">3</div>
                  <div class="${ styles.stepLabel }">Your Enquiry</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="${ styles.formContainer }">
            ${this.renderCurrentStep()}
          </div>
        </div>
      </div>`;

    this.setButtonHandlers();
  }

  private renderCurrentStep(): string {
    switch (this.currentStep) {
      case 1:
        return this.renderBasicInfoStep();
      case 2:
        return this.renderIndustryStep();
      case 3:
        return this.renderInquiryStep();
      case 4:
        return this.renderThankYouStep();
      default:
        return this.renderBasicInfoStep();
    }
  }

  private renderBasicInfoStep(): string {
    return `
      <div class="${ styles.formStep } ${styles.fadeIn}">
        <h3 class="${ styles.stepTitle }">Section A: Basic Information</h3>
        
        <div class="${ styles.formField }">
          <label for="fullName">Full Name <span class="${ styles.required }">*</span></label>
          <input type="text" id="fullName" class="${ styles.textField }${this.formData.fullName === '' && this.validateAttempted ? ' ' + styles.error : ''}" value="${this.formData.fullName || ''}">
          ${this.formData.fullName === '' && this.validateAttempted ? `<div class="${styles.errorText}">Full Name is required</div>` : ''}
        </div>
        
        <div class="${ styles.formField }">
          <label for="organisationName">Organisation Name <span class="${ styles.required }">*</span></label>
          <input type="text" id="organisationName" class="${ styles.textField }${this.formData.organisationName === '' && this.validateAttempted ? ' ' + styles.error : ''}" value="${this.formData.organisationName || ''}">
          ${this.formData.organisationName === '' && this.validateAttempted ? `<div class="${styles.errorText}">Organisation Name is required</div>` : ''}
        </div>
        
        <div class="${ styles.formField }">
          <label for="contactNumber">Contact Number</label>
          <input type="tel" id="contactNumber" class="${ styles.textField }" value="${this.formData.contactNumber || ''}">
        </div>
        
        <div class="${ styles.formField }">
          <label for="emailAddress">Email Address <span class="${ styles.required }">*</span></label>
          <input type="email" id="emailAddress" class="${ styles.textField }${(this.formData.emailAddress === '' || !this.isValidEmail(this.formData.emailAddress)) && this.validateAttempted ? ' ' + styles.error : ''}" value="${this.formData.emailAddress || ''}">
          ${this.formData.emailAddress === '' && this.validateAttempted ? `<div class="${styles.errorText}">Email Address is required</div>` : ''}
          ${this.formData.emailAddress !== '' && !this.isValidEmail(this.formData.emailAddress) && this.validateAttempted ? `<div class="${styles.errorText}">Please enter a valid email address</div>` : ''}
        </div>
        
        <div class="${ styles.formField }">
          <label for="websiteAddress">Website Address</label>
          <input type="url" id="websiteAddress" class="${ styles.textField }" value="${this.formData.websiteAddress || ''}">
        </div>
        
        <div class="${ styles.formField }">
          <label for="operationLocation">Where do you operate/intend to operate? <span class="${ styles.required }">*</span></label>
          <select id="operationLocation" class="${ styles.selectField }${this.formData.operationLocation === '' && this.validateAttempted ? ' ' + styles.error : ''}">
            <option value="" ${!this.formData.operationLocation ? 'selected' : ''}>Please select</option>
            <option value="South Africa only" ${this.formData.operationLocation === 'South Africa only' ? 'selected' : ''}>I operate in South Africa only</option>
            <option value="South Africa + other countries" ${this.formData.operationLocation === 'South Africa + other countries' ? 'selected' : ''}>I currently only operate in South Africa but intend to operate in other countries</option>
            <option value="Not operational - South Africa only" ${this.formData.operationLocation === 'Not operational - South Africa only' ? 'selected' : ''}>I am not yet operational but intend to operate only in South Africa</option>
            <option value="Not operational - South Africa + other countries" ${this.formData.operationLocation === 'Not operational - South Africa + other countries' ? 'selected' : ''}>I am not yet operational, but intend to operate in South Africa and other countries</option>
            <option value="Outside South Africa - plan to operate in South Africa" ${this.formData.operationLocation === 'Outside South Africa - plan to operate in South Africa' ? 'selected' : ''}>I operate outside of South Africa only, but intend to operate in South Africa</option>
          </select>
          ${this.formData.operationLocation === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please select your operation location</div>` : ''}
        </div>
        
        <div class="${ styles.formField }">
          <label>Please specify the countries in which you operate/intend operating? <span class="${ styles.required }">*</span></label>
          <div class="${ styles.info }">i
            <div class="${ styles.tooltip }">If you operate in more than 5 countries, please check the box marked "global presence"</div>
          </div>
          <div class="${ styles.countrySelector }">
            <div class="${ styles.searchBox }">
              <input type="text" id="countrySearch" class="${ styles.textField }" placeholder="Search countries..." />
            </div>
            <div class="${ styles.countryList }">
              ${COUNTRIES.map(country => `
                <div class="${ styles.countryItem }">
                  <input type="checkbox" id="country-${country.replace(/\s+/g, '-').toLowerCase()}" 
                    class="country-checkbox" value="${country}" 
                    ${this.formData.countriesOfOperation.includes(country) ? 'checked' : ''} />
                  <label for="country-${country.replace(/\s+/g, '-').toLowerCase()}">${country}</label>
                </div>
              `).join('')}
            </div>
            <div class="${ styles.selectedCountries }${this.formData.countriesOfOperation.length === 0 && this.validateAttempted ? ' ' + styles.error : ''}">
              ${this.formData.countriesOfOperation.length > 0 ? 
                this.formData.countriesOfOperation.map(country => `
                  <div class="${ styles.countryTag }" data-country="${country}">
                    ${country} <span class="${ styles.removeCountry }" data-country="${country}">×</span>
                  </div>
                `).join('') : 
                '<div>No countries selected</div>'
              }
            </div>
            ${this.formData.countriesOfOperation.length === 0 && this.validateAttempted ? `<div class="${styles.errorText}">Please select at least one country</div>` : ''}
          </div>
        </div>
        
        <div class="${ styles.formField }">
          <label for="operationLength">For how long has the organisation been in operation? <span class="${ styles.required }">*</span></label>
          <select id="operationLength" class="${ styles.selectField }${this.formData.operationLength === '' && this.validateAttempted ? ' ' + styles.error : ''}">
            <option value="" ${!this.formData.operationLength ? 'selected' : ''}>Please select</option>
            <option value="Not operational" ${this.formData.operationLength === 'Not operational' ? 'selected' : ''}>Not operational</option>
            <option value="<1 year" ${this.formData.operationLength === '<1 year' ? 'selected' : ''}>Less than 1 year</option>
            <option value="1-5 years" ${this.formData.operationLength === '1-5 years' ? 'selected' : ''}>1 – 5 years</option>
            <option value="5-10 years" ${this.formData.operationLength === '5-10 years' ? 'selected' : ''}>5 – 10 years</option>
            <option value=">10 years" ${this.formData.operationLength === '>10 years' ? 'selected' : ''}>More than 10 years</option>
          </select>
          ${this.formData.operationLength === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please select how long your organisation has been in operation</div>` : ''}
        </div>
        
        <div class="${ styles.formActions }">
          <button type="button" class="${ styles.button } ${styles.nextButton}" id="nextToStep2">Next</button>
        </div>
      </div>
    `;
  }

  private renderIndustryStep(): string {
    return `
      <div class="${ styles.formStep } ${styles.fadeIn}">
        <h3 class="${ styles.stepTitle }">Section B: Industry Information</h3>
        <div class="${ styles.sectionNote }">
          For the next section you may select more than one option if it applies to your organisation
        </div>
        
        <div class="${ styles.formField }">
          <label for="primaryBusinessAreas">What is the primary area of business in which you currently operate? <span class="${ styles.required }">*</span></label>
          <select id="primaryBusinessAreas" class="${ styles.selectField }${this.formData.primaryBusinessAreas === '' && this.validateAttempted ? ' ' + styles.error : ''}" onchange="document.dispatchEvent(new CustomEvent('primaryBusinessChanged'))">
            <option value="" ${!this.formData.primaryBusinessAreas ? 'selected' : ''}>Please select</option>
            <option value="banking" ${this.formData.primaryBusinessAreas === 'banking' ? 'selected' : ''}>Banking</option>
            <option value="payments" ${this.formData.primaryBusinessAreas === 'payments' ? 'selected' : ''}>Payments</option>
            <option value="insurance" ${this.formData.primaryBusinessAreas === 'insurance' ? 'selected' : ''}>Insurance</option>
            <option value="crypto" ${this.formData.primaryBusinessAreas === 'crypto' ? 'selected' : ''}>Crypto</option>
            <option value="investment" ${this.formData.primaryBusinessAreas === 'investment' ? 'selected' : ''}>Investment</option>
            <option value="credit" ${this.formData.primaryBusinessAreas === 'credit' ? 'selected' : ''}>Credit</option>
            <option value="notOperational" ${this.formData.primaryBusinessAreas === 'notOperational' ? 'selected' : ''}>Not operational</option>
          </select>
          ${this.formData.primaryBusinessAreas === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please select your primary business area</div>` : ''}
        </div>
        
        <div class="${ styles.formField }">
          <label for="productServiceCategory">Which product/service category does your enquiry relate to? <span class="${ styles.required }">*</span></label>
          <select id="productServiceCategory" class="${ styles.selectField }${this.formData.productServiceCategory === '' && this.validateAttempted ? ' ' + styles.error : ''}">
            <option value="" ${!this.formData.productServiceCategory ? 'selected' : ''}>Please select</option>
            ${this.renderProductServiceCategoryOptions()}
          </select>
          ${this.formData.productServiceCategory === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please select a product/service category</div>` : ''}
        </div>
        
        ${this.formData.productServiceCategory === 'Other' ? `
        <div class="${ styles.formField }">
          <label for="otherProductServiceCategory">Other product/service category <span class="${ styles.required }">*</span></label>
          <input type="text" id="otherProductServiceCategory" class="${ styles.textField }${this.formData.otherProductServiceCategory === '' && this.validateAttempted ? ' ' + styles.error : ''}" value="${this.formData.otherProductServiceCategory || ''}">
          ${this.formData.otherProductServiceCategory === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please specify the other product/service category</div>` : ''}
        </div>
        ` : ''}
        
        <div class="${ styles.formField }">
          <label>Is the product/service to which the enquiry relates operational in the market? <span class="${ styles.required }">*</span></label>
          <div class="${ styles.radioGroup }${this.formData.operationalStatus === null && this.validateAttempted ? ' ' + styles.error : ''}">
            <div class="${ styles.radioItem }">
              <input type="radio" id="operationalStatusYes" name="operationalStatus" value="yes" ${this.formData.operationalStatus === true ? 'checked' : ''}>
              <label for="operationalStatusYes">Yes</label>
            </div>
            <div class="${ styles.radioItem }">
              <input type="radio" id="operationalStatusNo" name="operationalStatus" value="no" ${this.formData.operationalStatus === false ? 'checked' : ''}>
              <label for="operationalStatusNo">No</label>
            </div>
          </div>
          ${this.formData.operationalStatus === null && this.validateAttempted ? `<div class="${styles.errorText}">Please indicate if the product/service is operational</div>` : ''}
        </div>
        
        <div class="${ styles.formField }">
          <label>Are you licensed/authorised/registered by regulatory authorities to undertake your primary business? <span class="${ styles.required }">*</span></label>
          <div class="${ styles.radioGroup }${this.formData.regulatoryStatus === null && this.validateAttempted ? ' ' + styles.error : ''}">
            <div class="${ styles.radioItem }">
              <input type="radio" id="regulatoryStatusYes" name="regulatoryStatus" value="yes" ${this.formData.regulatoryStatus === true ? 'checked' : ''} onchange="document.dispatchEvent(new CustomEvent('regulatoryStatusChanged', {detail: {value: 'yes'}}))">
              <label for="regulatoryStatusYes">Yes</label>
            </div>
            <div class="${ styles.radioItem }">
              <input type="radio" id="regulatoryStatusNo" name="regulatoryStatus" value="no" ${this.formData.regulatoryStatus === false ? 'checked' : ''} onchange="document.dispatchEvent(new CustomEvent('regulatoryStatusChanged', {detail: {value: 'no'}}))">
              <label for="regulatoryStatusNo">No</label>
            </div>
          </div>
          ${this.formData.regulatoryStatus === null && this.validateAttempted ? `<div class="${styles.errorText}">Please indicate your regulatory status</div>` : ''}
        </div>
        
        ${this.formData.regulatoryStatus === true ? `
        <div class="${ styles.formField }">
          <label>Select regulators <span class="${ styles.required }">*</span></label>
          <div class="${ styles.regulatorSelector }${this.formData.regulators.length === 0 && this.validateAttempted ? ' ' + styles.error : ''}">
            ${REGULATORS.map(regulator => `
              <div class="${ styles.checkboxItem }">
                <input type="checkbox" id="regulator-${regulator.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}" 
                  class="regulator-checkbox" value="${regulator}" 
                  ${this.formData.regulators.indexOf(regulator) !== -1 ? 'checked' : ''} />
                <label for="regulator-${regulator.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}">${regulator}</label>
              </div>
            `).join('')}
          </div>
          ${this.formData.regulators.length === 0 && this.validateAttempted ? `<div class="${styles.errorText}">Please select at least one regulator</div>` : ''}
        </div>
        ` : ''}
        
        ${this.formData.regulators.indexOf('Other') !== -1 ? `
        <div class="${ styles.formField }">
          <label for="otherRegulator">Please specify other regulator <span class="${ styles.required }">*</span></label>
          <input type="text" id="otherRegulator" class="${ styles.textField }${this.formData.otherRegulator === '' && this.validateAttempted ? ' ' + styles.error : ''}" value="${this.formData.otherRegulator || ''}">
          ${this.formData.otherRegulator === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please specify the other regulator</div>` : ''}
        </div>
        ` : ''}
        
        <div class="${ styles.formActions }">
          <button type="button" class="${ styles.button } ${styles.backButton}" id="backToStep1">Back</button>
          <button type="button" class="${ styles.button } ${styles.nextButton}" id="nextToStep3">Next</button>
        </div>
      </div>
    `;
  }
  
  private renderProductServiceCategoryOptions(): string {
    const businessArea = this.formData.primaryBusinessAreas;
    if (!businessArea || !CATEGORIES[businessArea]) {
      return '';
    }
    
    let options = '';
    const categories = CATEGORIES[businessArea];
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      options += `<option value="${category}" ${this.formData.productServiceCategory === category ? 'selected' : ''}>${category}</option>`;
    }
    
    return options;
  }

  private renderInquiryStep(): string {
    return `
      <div class="${ styles.formStep } ${styles.fadeIn}">
        <h3 class="${ styles.stepTitle }">Section C: Inquiry Details</h3>
        <div class="${ styles.sectionNote }">
          Please provide additional details about your product/service and specific questions you have
        </div>
        
        <div class="${ styles.formField }">
          <label for="productServiceDescription">Please describe your product/service and its key features <span class="${ styles.required }">*</span></label>
          <textarea id="productServiceDescription" class="${ styles.textareaField }${this.formData.productServiceDescription === '' && this.validateAttempted ? ' ' + styles.error : ''}" rows="5">${this.formData.productServiceDescription || ''}</textarea>
          ${this.formData.productServiceDescription === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please provide a description of your product/service</div>` : ''}
        </div>
        
        <div class="${ styles.formField }">
          <label>What are your specific questions for the Regulatory Guidance Unit? <span class="${ styles.required }">*</span></label>
          <div class="${ styles.questionsContainer }${this.formData.questions[0] === '' && this.validateAttempted ? ' ' + styles.error : ''}">
            ${this.renderQuestions()}
          </div>
          ${this.formData.questions[0] === '' && this.validateAttempted ? `<div class="${styles.errorText}">Please provide at least one question</div>` : ''}
          <button type="button" class="${ styles.button } ${styles.addButton}" id="addQuestionBtn">Add Another Question</button>
        </div>
        
        <div class="${ styles.formField }">
          <label for="additionalInformation">Any additional information related to your inquiry?</label>
          <textarea id="additionalInformation" class="${ styles.textareaField }" rows="3">${this.formData.additionalInformation || ''}</textarea>
        </div>
        
        <div class="${ styles.formField }">
          <label>Have you checked our FAQs for this information? <span class="${ styles.required }">*</span></label>
          <div class="${ styles.radioGroup }${this.formData.faqConfirmation === null && this.validateAttempted ? ' ' + styles.error : ''}">
            <div class="${ styles.radioItem }">
              <input type="radio" id="faqConfirmationYes" name="faqConfirmation" value="yes" ${this.formData.faqConfirmation === true ? 'checked' : ''}>
              <label for="faqConfirmationYes">Yes</label>
            </div>
            <div class="${ styles.radioItem }">
              <input type="radio" id="faqConfirmationNo" name="faqConfirmation" value="no" ${this.formData.faqConfirmation === false ? 'checked' : ''}>
              <label for="faqConfirmationNo">No</label>
            </div>
          </div>
          ${this.formData.faqConfirmation === null && this.validateAttempted ? `<div class="${styles.errorText}">Please indicate if you've checked our FAQs</div>` : ''}
          <div class="${ styles.faqLink }">
            <a href="${this.properties.faqPageUrl || '#'}" target="_blank">View FAQs</a>
          </div>
        </div>
        
        <div class="${ styles.formField }">
          <label>Supporting Files</label>
          <div class="${ styles.fileUploadContainer }">
            <input type="file" id="fileUpload" multiple class="${ styles.fileInput }" />
            <button type="button" class="${ styles.button } ${styles.uploadButton}" id="uploadBtn">Upload Files</button>
          </div>
          <div class="${ styles.uploadedFiles }" id="uploadedFilesContainer">
            ${this.renderUploadedFiles()}
          </div>
          <div class="${ styles.uploadNote }">
            Maximum 5 files allowed. Accepted formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 10MB each)
          </div>
        </div>
        
        <div class="${ styles.formField }">
          <div class="${ styles.checkbox }${!this.formData.consentConfirmation && this.validateAttempted ? ' ' + styles.error : ''}">
            <input type="checkbox" id="consentCheckbox" ${this.formData.consentConfirmation ? 'checked' : ''}>
            <label for="consentCheckbox">I consent to my information being processed in accordance with the privacy policy <span class="${ styles.required }">*</span></label>
          </div>
          ${!this.formData.consentConfirmation && this.validateAttempted ? `<div class="${styles.errorText}">You must provide consent to submit this form</div>` : ''}
        </div>
        
        <div class="${ styles.formActions }">
          <button type="button" class="${ styles.button } ${styles.backButton}" id="backToStep2">Back</button>
          <button type="button" class="${ styles.button } ${styles.submitButton}" id="submitBtn">${escape(this.properties.submitButtonText || 'Submit')}</button>
        </div>
      </div>
    `;
  }
  
  private renderQuestions(): string {
    let questionsHtml = '';
    
    for (let i = 0; i < this.formData.questions.length; i++) {
      questionsHtml += `
        <div class="${ styles.questionItem }">
          <textarea class="${ styles.textareaField } question-input" rows="2">${this.formData.questions[i] || ''}</textarea>
          ${i > 0 ? `<button type="button" class="${ styles.removeButton } remove-question-btn" data-index="${i}">Remove</button>` : ''}
        </div>
      `;
    }
    
    return questionsHtml;
  }
  
  private renderUploadedFiles(): string {
    if (!this.formData.files || this.formData.files.length === 0) {
      return '<div class="no-files">No files uploaded</div>';
    }
    
    let filesHtml = '';
    
    for (let i = 0; i < this.formData.files.length; i++) {
      const file = this.formData.files[i];
      filesHtml += `
        <div class="${ styles.fileItem }">
          <span class="${ styles.fileName }">${file.name}</span>
          <button type="button" class="${ styles.removeButton } remove-file-btn" data-index="${i}">Remove</button>
        </div>
      `;
    }
    
    return filesHtml;
  }

  private renderThankYouStep(): string {
    return `
      <div class="${ styles.formStep } ${styles.fadeIn} ${styles.thankYouStep}">
        <div class="${ styles.thankYouIcon }">
          <i class="${ styles.checkmark }">✓</i>
        </div>
        <h3 class="${ styles.thankYouTitle }">Thank You!</h3>
        <p class="${ styles.thankYouMessage }">${escape(this.properties.thankYouMessage || 'Your inquiry has been submitted successfully. We will contact you soon.')}</p>
        <div class="${ styles.formActions }">
          <button type="button" class="${ styles.button } ${styles.newInquiryButton}" id="newInquiryBtn">Submit Another Inquiry</button>
        </div>
      </div>
    `;
  }

  private setButtonHandlers(): void {
    // Navigation buttons
    const nextToStep2Button = document.getElementById('nextToStep2');
    if (nextToStep2Button) {
      nextToStep2Button.addEventListener('click', () => {
        if (this.validateStep1()) {
          this.saveStep1Data();
          this.currentStep = 2;
          this.validateAttempted = false;
          this.render();
        }
      });
    }
    
    const backToStep1Button = document.getElementById('backToStep1');
    if (backToStep1Button) {
      backToStep1Button.addEventListener('click', () => {
        this.currentStep = 1;
        this.validateAttempted = false;
        this.render();
      });
    }
    
    const nextToStep3Button = document.getElementById('nextToStep3');
    if (nextToStep3Button) {
      nextToStep3Button.addEventListener('click', () => {
        if (this.validateStep2()) {
          this.saveStep2Data();
          this.currentStep = 3;
          this.validateAttempted = false;
          this.render();
        }
      });
    }
    
    const backToStep2Button = document.getElementById('backToStep2');
    if (backToStep2Button) {
      backToStep2Button.addEventListener('click', () => {
        this.currentStep = 2;
        this.validateAttempted = false;
        this.render();
      });
    }
    
    const submitButton = document.getElementById('submitBtn');
    if (submitButton) {
      submitButton.addEventListener('click', () => {
        if (this.validateStep3()) {
          this.saveStep3Data();
          this.submitForm();
        }
      });
    }
    
    const newInquiryButton = document.getElementById('newInquiryBtn');
    if (newInquiryButton) {
      newInquiryButton.addEventListener('click', () => {
        this.resetForm();
      });
    }
    
    // Setup country search and selection
    this.setupCountrySelector();
    
    // Setup regulators selection if in step 2
    if (this.currentStep === 2) {
      this.setupRegulatorSelector();
      
      // Handle primary business area change
      document.addEventListener('primaryBusinessChanged', () => {
        const primaryBusinessAreasSelect = document.getElementById('primaryBusinessAreas') as HTMLSelectElement;
        if (primaryBusinessAreasSelect) {
          this.formData.primaryBusinessAreas = primaryBusinessAreasSelect.value;
          this.formData.productServiceCategory = '';
          this.render();
        }
      });
      
      // Handle regulatory status change
      document.addEventListener('regulatoryStatusChanged', (e: any) => {
        if (e.detail && e.detail.value) {
          this.formData.regulatoryStatus = e.detail.value === 'yes';
          this.render();
          
          if (this.formData.regulatoryStatus === true) {
            // Re-setup regulator selector after render
            this.setupRegulatorSelector();
          }
        }
      });
    }
    
    // Setup question management and file upload if in step 3
    if (this.currentStep === 3) {
      // Add question button
      const addQuestionBtn = document.getElementById('addQuestionBtn');
      if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
          this.formData.questions.push('');
          this.render();
          this.setupRemoveQuestionButtons();
        });
      }
      
      // Remove question buttons
      this.setupRemoveQuestionButtons();
      
      // File upload
      const uploadBtn = document.getElementById('uploadBtn');
      const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
      
      if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
          if (fileInput.files && fileInput.files.length > 0) {
            const maxFiles = 5;
            const maxFileSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                                 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                 'image/png', 'image/jpeg'];
            
            // Validate number of files
            if (this.formData.files.length + fileInput.files.length > maxFiles) {
              alert(`You can upload a maximum of ${maxFiles} files.`);
              return;
            }
            
            let invalidFiles = false;
            
            // Add files to the form data
            for (let i = 0; i < fileInput.files.length; i++) {
              const file = fileInput.files[i];
              
              // Validate file size
              if (file.size > maxFileSize) {
                alert(`File "${file.name}" exceeds the maximum size of 10MB.`);
                invalidFiles = true;
                continue;
              }
              
              // Validate file type
              if (allowedTypes.indexOf(file.type) === -1) {
                alert(`File "${file.name}" is not an allowed file type.`);
                invalidFiles = true;
                continue;
              }
              
              this.formData.files.push(file);
            }
            
            if (!invalidFiles) {
              // Clear the file input
              fileInput.value = '';
            }
            
            // Re-render the file list
            this.render();
            this.setupRemoveFileButtons();
          }
        });
      }
      
      // Remove file buttons
      this.setupRemoveFileButtons();
    }
  }
  
  private setupCountrySelector(): void {
    // Set up country search functionality
    const countrySearch = this.domElement.querySelector('#countrySearch') as HTMLInputElement;
    if (countrySearch) {
      countrySearch.addEventListener('input', (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        const countryItems = this.domElement.querySelectorAll(`.${styles.countryItem}`);
        
        for (let i = 0; i < countryItems.length; i++) {
          const item = countryItems[i] as HTMLElement;
          const countryName = (item.querySelector('label') as HTMLElement).textContent.toLowerCase();
          if (countryName.indexOf(searchTerm) !== -1) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        }
      });
    }

    // Set up country checkboxes
    const countryCheckboxes = this.domElement.querySelectorAll('.country-checkbox');
    for (let i = 0; i < countryCheckboxes.length; i++) {
      const checkbox = countryCheckboxes[i] as HTMLInputElement;
      checkbox.addEventListener('change', (e) => {
        const country = (e.target as HTMLInputElement).value;
        if ((e.target as HTMLInputElement).checked) {
          // Add country if not already in array
          if (this.formData.countriesOfOperation.indexOf(country) === -1) {
            this.formData.countriesOfOperation.push(country);
          }
        } else {
          // Remove country
          const index = this.formData.countriesOfOperation.indexOf(country);
          if (index > -1) {
            this.formData.countriesOfOperation.splice(index, 1);
          }
        }
        
        // Update the selected countries display
        this.updateSelectedCountriesDisplay();
      });
    }

    // Set up remove country buttons
    this.setupRemoveCountryButtons();
  }

  private setupRemoveCountryButtons(): void {
    const removeButtons = this.domElement.querySelectorAll(`.${styles.removeCountry}`);
    for (let i = 0; i < removeButtons.length; i++) {
      const removeBtn = removeButtons[i] as HTMLElement;
      removeBtn.addEventListener('click', (e) => {
        const country = (e.target as HTMLElement).getAttribute('data-country');
        
        // Remove country from the array
        const index = this.formData.countriesOfOperation.indexOf(country);
        if (index > -1) {
          this.formData.countriesOfOperation.splice(index, 1);
        }
        
        // Uncheck the checkbox
        const checkbox = this.domElement.querySelector(`#country-${country.replace(/\s+/g, '-').toLowerCase()}`) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = false;
        }
        
        // Update the display
        this.updateSelectedCountriesDisplay();
      });
    }
  }

  private updateSelectedCountriesDisplay(): void {
    const container = this.domElement.querySelector(`.${styles.selectedCountries}`);
    if (!container) return;
    
    if (this.formData.countriesOfOperation.length > 0) {
      let htmlContent = '';
      for (let i = 0; i < this.formData.countriesOfOperation.length; i++) {
        const country = this.formData.countriesOfOperation[i];
        htmlContent += `
          <div class="${styles.countryTag}" data-country="${country}">
            ${country} <span class="${styles.removeCountry}" data-country="${country}">×</span>
          </div>
        `;
      }
      container.innerHTML = htmlContent;
      
      // Re-attach event listeners to new elements
      this.setupRemoveCountryButtons();
    } else {
      container.innerHTML = '<div>No countries selected</div>';
    }
    
    // Update validation styling
    if (this.validateAttempted) {
      if (this.formData.countriesOfOperation.length === 0) {
        container.classList.add(styles.error);
        if (!container.nextElementSibling || !container.nextElementSibling.classList.contains(styles.errorText)) {
          container.insertAdjacentHTML('afterend', `<div class="${styles.errorText}">Please select at least one country</div>`);
        }
      } else {
        container.classList.remove(styles.error);
        const errorText = container.nextElementSibling;
        if (errorText && errorText.classList.contains(styles.errorText)) {
          errorText.remove();
        }
      }
    }
  }

  private validateStep1(): boolean {
    let isValid = true;
    
    // Validate fullName
    if (!this.formData.fullName.trim()) {
      isValid = false;
    }
    
    // Validate organisationName
    if (!this.formData.organisationName.trim()) {
      isValid = false;
    }
    
    // Validate emailAddress
    if (!this.formData.emailAddress.trim() || !this.isValidEmail(this.formData.emailAddress)) {
      isValid = false;
    }
    
    // Validate operationLocation
    if (!this.formData.operationLocation) {
      isValid = false;
    }
    
    // Validate countriesOfOperation
    if (this.formData.countriesOfOperation.length === 0) {
      isValid = false;
    }
    
    // Validate operationLength
    if (!this.formData.operationLength) {
      isValid = false;
    }
    
    // Re-render form to show error messages
    if (!isValid) {
      this.render();
    }
    
    return isValid;
  }

  private validateStep2(): boolean {
    let isValid = true;
    
    // Primary business area validation
    if (!this.formData.primaryBusinessAreas) {
      isValid = false;
    }
    
    // Product/service category validation
    if (!this.formData.productServiceCategory) {
      isValid = false;
    }
    
    // Other product/service category validation if "Other" is selected
    if (this.formData.productServiceCategory === 'Other' && !this.formData.otherProductServiceCategory) {
      isValid = false;
    }
    
    // Operational status validation
    if (this.formData.operationalStatus === null) {
      isValid = false;
    }
    
    // Regulatory status validation
    if (this.formData.regulatoryStatus === null) {
      isValid = false;
    }
    
    // Regulators validation if regulatory status is "Yes"
    if (this.formData.regulatoryStatus === true && this.formData.regulators.length === 0) {
      isValid = false;
    }
    
    // Other regulator validation if "Other" is selected
    if (this.formData.regulators.indexOf('Other') !== -1 && !this.formData.otherRegulator) {
      isValid = false;
    }
    
    // Set validation attempted flag and re-render if not valid
    if (!isValid) {
      this.validateAttempted = true;
      this.render();
    }
    
    return isValid;
  }

  private validateStep3(): boolean {
    let isValid = true;
    
    // Product/service description validation
    if (!this.formData.productServiceDescription) {
      isValid = false;
    }
    
    // Questions validation (at least one question required)
    if (this.formData.questions.length === 0 || !this.formData.questions[0]) {
      isValid = false;
    }
    
    // FAQ confirmation validation
    if (this.formData.faqConfirmation === null) {
      isValid = false;
    }
    
    // Consent validation
    if (!this.formData.consentConfirmation) {
      isValid = false;
    }
    
    // Set validation attempted flag and re-render if not valid
    if (!isValid) {
      this.validateAttempted = true;
      this.render();
    }
    
    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(String(email).toLowerCase());
  }

  private saveStep1Data(): void {
    this.formData.fullName = (this.domElement.querySelector('#fullName') as HTMLInputElement).value;
    this.formData.organisationName = (this.domElement.querySelector('#organisationName') as HTMLInputElement).value;
    this.formData.contactNumber = (this.domElement.querySelector('#contactNumber') as HTMLInputElement).value;
    this.formData.emailAddress = (this.domElement.querySelector('#emailAddress') as HTMLInputElement).value;
    this.formData.websiteAddress = (this.domElement.querySelector('#websiteAddress') as HTMLInputElement).value;
    this.formData.operationLocation = (this.domElement.querySelector('#operationLocation') as HTMLSelectElement).value;
    this.formData.operationLength = (this.domElement.querySelector('#operationLength') as HTMLSelectElement).value;
    
    // Country selection is handled by event listeners that update this.formData.countriesOfOperation
  }

  private saveStep2Data(): void {
    // Get primary business area
    const primaryBusinessAreasSelect = document.getElementById('primaryBusinessAreas') as HTMLSelectElement;
    if (primaryBusinessAreasSelect) {
      this.formData.primaryBusinessAreas = primaryBusinessAreasSelect.value;
    }
    
    // Get product/service category
    const productServiceCategorySelect = document.getElementById('productServiceCategory') as HTMLSelectElement;
    if (productServiceCategorySelect) {
      this.formData.productServiceCategory = productServiceCategorySelect.value;
    }
    
    // Get other product/service category if applicable
    if (this.formData.productServiceCategory === 'Other') {
      const otherProductServiceCategoryInput = document.getElementById('otherProductServiceCategory') as HTMLInputElement;
      if (otherProductServiceCategoryInput) {
        this.formData.otherProductServiceCategory = otherProductServiceCategoryInput.value;
      }
    }
    
    // Get operational status
    const operationalStatusYes = document.getElementById('operationalStatusYes') as HTMLInputElement;
    const operationalStatusNo = document.getElementById('operationalStatusNo') as HTMLInputElement;
    if (operationalStatusYes && operationalStatusNo) {
      if (operationalStatusYes.checked) {
        this.formData.operationalStatus = true;
      } else if (operationalStatusNo.checked) {
        this.formData.operationalStatus = false;
      }
    }
    
    // Get regulatory status
    const regulatoryStatusYes = document.getElementById('regulatoryStatusYes') as HTMLInputElement;
    const regulatoryStatusNo = document.getElementById('regulatoryStatusNo') as HTMLInputElement;
    if (regulatoryStatusYes && regulatoryStatusNo) {
      if (regulatoryStatusYes.checked) {
        this.formData.regulatoryStatus = true;
      } else if (regulatoryStatusNo.checked) {
        this.formData.regulatoryStatus = false;
      }
    }
    
    // Regulator checkboxes are handled by event listeners that update the regulators array
    
    // Get other regulator if applicable
    if (this.formData.regulators.indexOf('Other') !== -1) {
      const otherRegulatorInput = document.getElementById('otherRegulator') as HTMLInputElement;
      if (otherRegulatorInput) {
        this.formData.otherRegulator = otherRegulatorInput.value;
      }
    }
  }

  private saveStep3Data(): void {
    // Get product/service description
    const descriptionTextarea = document.getElementById('productServiceDescription') as HTMLTextAreaElement;
    if (descriptionTextarea) {
      this.formData.productServiceDescription = descriptionTextarea.value;
    }
    
    // Get questions
    const questionInputs = document.querySelectorAll('.question-input') as NodeListOf<HTMLTextAreaElement>;
    this.formData.questions = [];
    
    for (let i = 0; i < questionInputs.length; i++) {
      const question = questionInputs[i].value.trim();
      if (question) {
        this.formData.questions.push(question);
      }
    }
    
    // Get additional information
    const additionalInfoTextarea = document.getElementById('additionalInformation') as HTMLTextAreaElement;
    if (additionalInfoTextarea) {
      this.formData.additionalInformation = additionalInfoTextarea.value;
    }
    
    // Get FAQ confirmation
    const faqYes = document.getElementById('faqConfirmationYes') as HTMLInputElement;
    const faqNo = document.getElementById('faqConfirmationNo') as HTMLInputElement;
    if (faqYes && faqNo) {
      if (faqYes.checked) {
        this.formData.faqConfirmation = true;
      } else if (faqNo.checked) {
        this.formData.faqConfirmation = false;
      }
    }
    
    // Get consent confirmation
    const consentCheckbox = document.getElementById('consentCheckbox') as HTMLInputElement;
    if (consentCheckbox) {
      this.formData.consentConfirmation = consentCheckbox.checked;
    }
    
    // Files are handled by the file upload event handler
  }

  private submitForm(): void {
    // Here you would typically submit the form data to a SharePoint list or service
    console.log('Form submitted:', this.formData);
    
    // For demo purposes, we'll just show the thank you step
    this.currentStep = 4;
    this.render();
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.formData = {
      // Basic Information
      fullName: '',
      organisationName: '',
      contactNumber: '',
      emailAddress: '',
      websiteAddress: '',
      operationLocation: '',
      countriesOfOperation: [],
      operationLength: '',
      
      // Industry Information
      primaryBusinessAreas: '',
      productServiceCategory: '',
      otherProductServiceCategory: '',
      operationalStatus: null,
      regulatoryStatus: null,
      regulators: [],
      otherRegulator: '',
      
      // Enquiry Details
      productServiceDescription: '',
      questions: [''],
      additionalInformation: '',
      faqConfirmation: null,
      consentConfirmation: false,
      
      // Attachments
      files: []
    };
    this.render();
  }

  private setupRegulatorSelector(): void {
    const regulatorCheckboxes = document.querySelectorAll('.regulator-checkbox') as NodeListOf<HTMLInputElement>;
    
    for (let i = 0; i < regulatorCheckboxes.length; i++) {
      const checkbox = regulatorCheckboxes[i];
      
      checkbox.addEventListener('change', () => {
        const regulator = checkbox.value;
        const index = this.formData.regulators.indexOf(regulator);
        
        if (checkbox.checked && index === -1) {
          // Add regulator to the list
          this.formData.regulators.push(regulator);
        } else if (!checkbox.checked && index !== -1) {
          // Remove regulator from the list
          this.formData.regulators.splice(index, 1);
        }
        
        // If Other is checked/unchecked, re-render to show/hide the text field
        if (regulator === 'Other') {
          this.render();
          // Re-setup regulator selector after render if Other is checked
          if (checkbox.checked) {
            this.setupRegulatorSelector();
          }
        }
      });
    }
  }

  private setupRemoveQuestionButtons(): void {
    const removeButtons = document.querySelectorAll('.remove-question-btn');
    
    for (let i = 0; i < removeButtons.length; i++) {
      const button = removeButtons[i] as HTMLButtonElement;
      
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'), 10);
        if (!isNaN(index) && index > 0 && index < this.formData.questions.length) {
          this.formData.questions.splice(index, 1);
          this.render();
          this.setupRemoveQuestionButtons();
        }
      });
    }
  }
  
  private setupRemoveFileButtons(): void {
    const removeButtons = document.querySelectorAll('.remove-file-btn');
    
    for (let i = 0; i < removeButtons.length; i++) {
      const button = removeButtons[i] as HTMLButtonElement;
      
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'), 10);
        if (!isNaN(index) && index >= 0 && index < this.formData.files.length) {
          this.formData.files.splice(index, 1);
          this.render();
          this.setupRemoveFileButtons();
        }
      });
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('formTitle', {
                  label: 'Form Title'
                }),
                PropertyPaneTextField('submitButtonText', {
                  label: 'Submit Button Text'
                }),
                PropertyPaneTextField('thankYouMessage', {
                  label: 'Thank You Message'
                }),
                PropertyPaneTextField('faqPageUrl', {
                  label: 'FAQs Page URL'
                }),
                PropertyPaneTextField('submissionListName', {
                  label: 'Submission List Name'
                }),
                PropertyPaneTextField('documentLibraryName', {
                  label: 'Document Library Name'
                }),
                PropertyPaneTextField('notificationEmail', {
                  label: 'Notification Email'
                }),
                PropertyPaneTextField('adminGroupName', {
                  label: 'Admin Group Name'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
