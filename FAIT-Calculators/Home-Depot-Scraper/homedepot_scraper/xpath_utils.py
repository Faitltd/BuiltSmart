"""
XPath Utilities for Home Depot Scraper

This module provides XPath-based utilities for extracting data from Home Depot web pages.
"""

import logging
import os
from lxml import html
import requests
from typing import List, Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

# Common XPath selectors
FORM_GROUP_SELECTOR = '//*[contains(concat( " ", @class, " " ), concat( " ", "form-group", " " ))]'
PRODUCT_TITLE_SELECTOR = '//h1[@class="product-title__title"]'
PRODUCT_PRICE_SELECTOR = '//*[@data-testid="current-price"]'
PRODUCT_DESCRIPTION_SELECTOR = '//*[@data-testid="product-description"]'
PRODUCT_SPECIFICATIONS_SELECTOR = '//*[@data-testid="specifications"]'

class XPathScraper:
    """XPath-based scraper for Home Depot product pages."""

    def __init__(self, user_agent: Optional[str] = None):
        """Initialize the XPath scraper.

        Args:
            user_agent: Optional user agent string to use for requests
        """
        self.session = requests.Session()
        if user_agent:
            self.session.headers.update({'User-Agent': user_agent})
        else:
            # Default user agent that mimics a regular browser
            self.session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })

    def get_page_content(self, url_or_path: str) -> Optional[html.HtmlElement]:
        """Get the HTML content of a page and parse it.

        Args:
            url_or_path: URL of the page to scrape or path to a local HTML file

        Returns:
            Parsed HTML element or None if the request failed
        """
        try:
            # Check if it's a local file
            if os.path.exists(url_or_path):
                logger.info(f"Loading HTML from local file: {url_or_path}")
                with open(url_or_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return html.fromstring(content)

            # Otherwise, treat it as a URL
            logger.info(f"Fetching HTML from URL: {url_or_path}")
            response = self.session.get(url_or_path, timeout=30)
            response.raise_for_status()
            return html.fromstring(response.content)
        except Exception as e:
            logger.error(f"Error loading HTML from {url_or_path}: {str(e)}")
            return None

    def extract_form_groups(self, page_content: html.HtmlElement) -> List[html.HtmlElement]:
        """Extract all form-group elements from the page.

        Args:
            page_content: Parsed HTML content

        Returns:
            List of form-group elements
        """
        return page_content.xpath(FORM_GROUP_SELECTOR)

    def extract_form_data(self, page_content: html.HtmlElement) -> Dict[str, str]:
        """Extract form data from form-group elements.

        Args:
            page_content: Parsed HTML content

        Returns:
            Dictionary of form field names and values
        """
        form_data = {}
        form_groups = self.extract_form_groups(page_content)

        for form_group in form_groups:
            # Try to find label and input/select/textarea elements
            labels = form_group.xpath('.//label')
            inputs = form_group.xpath('.//input | .//select | .//textarea')

            if labels and inputs:
                label_text = labels[0].text_content().strip()
                input_element = inputs[0]

                # Get the value based on the input type
                tag_name = input_element.tag
                if tag_name == 'input':
                    input_type = input_element.get('type', 'text')
                    if input_type in ['text', 'number', 'email', 'tel', 'hidden']:
                        value = input_element.get('value', '')
                    elif input_type == 'checkbox':
                        value = 'checked' if input_element.get('checked') is not None else ''
                    elif input_type == 'radio':
                        # For radio buttons, find the checked one
                        name = input_element.get('name', '')
                        checked_radio = form_group.xpath(f'.//input[@type="radio"][@name="{name}"][@checked]')
                        value = checked_radio[0].get('value', '') if checked_radio else ''
                    else:
                        value = input_element.get('value', '')
                elif tag_name == 'select':
                    # For select elements, find the selected option
                    selected_options = input_element.xpath('.//option[@selected]')
                    value = selected_options[0].get('value', '') if selected_options else ''
                elif tag_name == 'textarea':
                    value = input_element.text_content().strip()
                else:
                    value = ''

                form_data[label_text] = value

        return form_data

    def extract_product_data(self, url_or_path: str) -> Dict[str, Any]:
        """Extract product data from a Home Depot product page.

        Args:
            url_or_path: URL of the product page or path to a local HTML file

        Returns:
            Dictionary of product data
        """
        page_content = self.get_page_content(url_or_path)
        if page_content is None:
            return {}

        # Extract basic product information
        product_data = {
            'source': url_or_path,
            'title': self._get_text(page_content, PRODUCT_TITLE_SELECTOR),
            'price': self._get_text(page_content, PRODUCT_PRICE_SELECTOR),
            'description': self._get_text(page_content, PRODUCT_DESCRIPTION_SELECTOR),
        }

        # Extract specifications
        specs_section = page_content.xpath(PRODUCT_SPECIFICATIONS_SELECTOR)
        if specs_section:
            specs = {}
            spec_rows = specs_section[0].xpath('.//tr')
            for row in spec_rows:
                cells = row.xpath('./td')
                if len(cells) >= 2:
                    key = cells[0].text_content().strip()
                    value = cells[1].text_content().strip()
                    specs[key] = value
            product_data['specifications'] = specs

        # Extract form data
        product_data['form_data'] = self.extract_form_data(page_content)

        return product_data

    def _get_text(self, element: html.HtmlElement, xpath: str) -> str:
        """Get text content from an element using XPath.

        Args:
            element: HTML element to search within
            xpath: XPath selector

        Returns:
            Text content or empty string if not found
        """
        elements = element.xpath(xpath)
        return elements[0].text_content().strip() if elements else ''


def scrape_product_page(url_or_path: str, user_agent: Optional[str] = None) -> Dict[str, Any]:
    """Scrape a Home Depot product page using XPath.

    Args:
        url_or_path: URL of the product page or path to a local HTML file
        user_agent: Optional user agent string to use for requests

    Returns:
        Dictionary of product data
    """
    scraper = XPathScraper(user_agent)
    return scraper.extract_product_data(url_or_path)


def extract_form_groups_from_url(url_or_path: str, user_agent: Optional[str] = None) -> List[Dict[str, str]]:
    """Extract form groups from a URL or local HTML file.

    Args:
        url_or_path: URL to scrape or path to a local HTML file
        user_agent: Optional user agent string to use for requests

    Returns:
        List of dictionaries containing form field data
    """
    scraper = XPathScraper(user_agent)
    page_content = scraper.get_page_content(url_or_path)
    if page_content is None:
        return []

    form_groups = scraper.extract_form_groups(page_content)
    result = []

    for form_group in form_groups:
        form_data = {}

        # Extract label text
        labels = form_group.xpath('.//label')
        if labels:
            form_data['label'] = labels[0].text_content().strip()
            form_data['label_for'] = labels[0].get('for', '')

        # Extract input elements
        inputs = form_group.xpath('.//input | .//select | .//textarea')
        if inputs:
            input_element = inputs[0]
            form_data['element_type'] = input_element.tag
            form_data['element_id'] = input_element.get('id', '')
            form_data['element_name'] = input_element.get('name', '')
            form_data['element_class'] = input_element.get('class', '')

            # Get value based on element type
            if input_element.tag == 'input':
                form_data['input_type'] = input_element.get('type', 'text')
                form_data['value'] = input_element.get('value', '')
            elif input_element.tag == 'select':
                options = input_element.xpath('.//option')
                form_data['options'] = [
                    {
                        'value': option.get('value', ''),
                        'text': option.text_content().strip(),
                        'selected': option.get('selected') is not None
                    }
                    for option in options
                ]
            elif input_element.tag == 'textarea':
                form_data['value'] = input_element.text_content().strip()

        # Extract help text
        help_text = form_group.xpath('.//small[@class="form-text"] | .//small[@class="help-block"]')
        if help_text:
            form_data['help_text'] = help_text[0].text_content().strip()

        result.append(form_data)

    return result
