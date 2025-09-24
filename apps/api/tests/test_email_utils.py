"""Email utility tests."""

import pytest
from unittest.mock import Mock, patch, mock_open
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.utils.email import (
    create_transport,
    send_text_email,
    send_html_email,
    send_email_with_attachment,
    send_bulk_emails,
    SMTP_EMAIL,
    SMTP_SERVER,
    SMTP_PORT,
)


class TestEmailUtilities:
    """Test email utility functions."""

    @patch("app.utils.email.smtplib.SMTP")
    def test_create_transport_success(self, mock_smtp):
        """Test successful SMTP transport creation."""
        mock_server = Mock()
        mock_smtp.return_value = mock_server

        result = create_transport()

        assert result == mock_server
        mock_smtp.assert_called_once_with(SMTP_SERVER, SMTP_PORT)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with(SMTP_EMAIL, "hgbp hgoc txwp nqte")

    @patch("app.utils.email.create_transport")
    def test_send_text_email_success(self, mock_create_transport):
        """Test successful text email sending."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        result = send_text_email("test@example.com", "Test Subject", "Test message")

        assert result is True
        mock_server.sendmail.assert_called_once()

        # Verify sendmail was called with correct parameters
        call_args = mock_server.sendmail.call_args[0]
        assert call_args[0] == SMTP_EMAIL
        assert call_args[1] == "test@example.com"
        assert "Test Subject" in call_args[2]
        assert "Test message" in call_args[2]

    @patch("app.utils.email.create_transport")
    def test_send_text_email_smtp_exception(self, mock_create_transport):
        """Test text email sending with SMTP exception."""
        mock_server = Mock()
        mock_server.sendmail.side_effect = smtplib.SMTPException("SMTP error")
        mock_create_transport.return_value.__enter__.return_value = mock_server

        result = send_text_email("test@example.com", "Test Subject", "Test message")

        assert result is False

    @patch("app.utils.email.create_transport")
    def test_send_text_email_general_exception(self, mock_create_transport):
        """Test text email sending with general exception."""
        mock_server = Mock()
        mock_server.sendmail.side_effect = Exception("General error")
        mock_create_transport.return_value.__enter__.return_value = mock_server

        result = send_text_email("test@example.com", "Test Subject", "Test message")

        assert result is False

    @patch("app.utils.email.create_transport")
    @patch("app.utils.email.prepare_email")
    def test_send_html_email_success(self, mock_prepare_email, mock_create_transport):
        """Test successful HTML email sending."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server
        mock_prepare_email.return_value = "<html><body>Test HTML</body></html>"

        result = send_html_email("test@example.com", "HTML Subject", "HTML message")

        assert result is True
        mock_prepare_email.assert_called_once_with("HTML message")
        mock_server.sendmail.assert_called_once()

    @patch("app.utils.email.create_transport")
    @patch("app.utils.email.prepare_email")
    def test_send_html_email_smtp_exception(
        self, mock_prepare_email, mock_create_transport
    ):
        """Test HTML email sending with SMTP exception."""
        mock_server = Mock()
        mock_server.sendmail.side_effect = smtplib.SMTPException("SMTP error")
        mock_create_transport.return_value.__enter__.return_value = mock_server
        mock_prepare_email.return_value = "<html><body>Test</body></html>"

        result = send_html_email("test@example.com", "Subject", "Message")

        assert result is False

    @patch("app.utils.email.create_transport")
    @patch("app.utils.email.prepare_email")
    def test_send_html_email_general_exception(
        self, mock_prepare_email, mock_create_transport
    ):
        """Test HTML email sending with general exception."""
        mock_server = Mock()
        mock_server.sendmail.side_effect = Exception("General error")
        mock_create_transport.return_value.__enter__.return_value = mock_server
        mock_prepare_email.return_value = "<html><body>Test</body></html>"

        result = send_html_email("test@example.com", "Subject", "Message")

        assert result is False

    @patch("app.utils.email.create_transport")
    @patch("builtins.open", new_callable=mock_open, read_data=b"file content")
    def test_send_email_with_attachment_success(self, mock_file, mock_create_transport):
        """Test sending email with attachment."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        send_email_with_attachment(
            "test@example.com",
            "Attachment Subject",
            "Message with attachment",
            "/path/to/file.txt",
        )

        mock_server.sendmail.assert_called_once()
        mock_file.assert_called_once_with("/path/to/file.txt", "rb")

    @patch("app.utils.email.create_transport")
    def test_send_bulk_emails_text(self, mock_create_transport):
        """Test sending bulk text emails."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        recipients = ["user1@example.com", "user2@example.com", "user3@example.com"]

        send_bulk_emails(recipients, "Bulk Subject", "Bulk message", is_html=False)

        # Should call sendmail for each recipient
        assert mock_server.sendmail.call_count == 3

        # Verify each call
        for i, call in enumerate(mock_server.sendmail.call_args_list):
            assert call[0][0] == SMTP_EMAIL
            assert call[0][1] == recipients[i]
            assert "Bulk Subject" in call[0][2]
            assert "Bulk message" in call[0][2]

    @patch("app.utils.email.create_transport")
    def test_send_bulk_emails_html(self, mock_create_transport):
        """Test sending bulk HTML emails."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        recipients = ["html1@example.com", "html2@example.com"]

        send_bulk_emails(
            recipients, "HTML Bulk Subject", "<h1>HTML message</h1>", is_html=True
        )

        # Should call sendmail for each recipient
        assert mock_server.sendmail.call_count == 2

    @patch("app.utils.email.smtplib.SMTP")
    def test_create_transport_connection_error(self, mock_smtp):
        """Test transport creation with connection error."""
        mock_smtp.side_effect = smtplib.SMTPException("Connection failed")

        with pytest.raises(smtplib.SMTPException):
            create_transport()

    @patch("app.utils.email.smtplib.SMTP")
    def test_create_transport_auth_error(self, mock_smtp):
        """Test transport creation with authentication error."""
        mock_server = Mock()
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(
            535, "Authentication failed"
        )
        mock_smtp.return_value = mock_server

        with pytest.raises(smtplib.SMTPAuthenticationError):
            create_transport()

    def test_email_configuration_constants(self):
        """Test email configuration constants."""
        assert SMTP_EMAIL == "budgetmapapp@gmail.com"
        assert SMTP_SERVER == "smtp.gmail.com"
        assert SMTP_PORT == 587

    @patch("app.utils.email.create_transport")
    def test_send_text_email_message_format(self, mock_create_transport):
        """Test text email message formatting."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        to_email = "format@example.com"
        subject = "Format Test"
        message = "This is a test message"

        send_text_email(to_email, subject, message)

        # Get the message content that was sent
        call_args = mock_server.sendmail.call_args[0]
        sent_message = call_args[2]

        # Verify message contains expected headers and content
        assert f"To: {to_email}" in sent_message
        assert f"Subject: {subject}" in sent_message
        assert f"From: {SMTP_EMAIL}" in sent_message
        assert message in sent_message

    @patch("app.utils.email.create_transport")
    @patch("app.utils.email.prepare_email")
    def test_send_html_email_headers(self, mock_prepare_email, mock_create_transport):
        """Test HTML email custom headers."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server
        mock_prepare_email.return_value = "<html><body>Test</body></html>"

        send_html_email("headers@example.com", "Header Test", "Message")

        # Get the message content
        call_args = mock_server.sendmail.call_args[0]
        sent_message = call_args[2]

        # Verify custom headers are present
        assert "X-Mailer: Shiftbay Mailer" in sent_message
        assert "X-Priority: 3" in sent_message
        assert "Content-Type: text/html" in sent_message

    @patch("app.utils.email.create_transport")
    def test_bulk_email_empty_recipients(self, mock_create_transport):
        """Test bulk email with empty recipient list."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        send_bulk_emails([], "Subject", "Message")

        # Should not call sendmail for empty list
        mock_server.sendmail.assert_not_called()

    @patch("app.utils.email.create_transport")
    def test_bulk_email_single_recipient(self, mock_create_transport):
        """Test bulk email with single recipient."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        send_bulk_emails(["single@example.com"], "Single Subject", "Single message")

        # Should call sendmail once
        assert mock_server.sendmail.call_count == 1


class TestEmailIntegration:
    """Integration tests for email functionality."""

    @patch("app.utils.email.create_transport")
    @patch("app.utils.email.prepare_email")
    def test_email_template_integration(
        self, mock_prepare_email, mock_create_transport
    ):
        """Test integration between email sending and template preparation."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        # Mock template preparation
        template_content = (
            "<html><body><h1>Welcome!</h1><p>Test message</p></body></html>"
        )
        mock_prepare_email.return_value = template_content

        result = send_html_email(
            "integration@example.com", "Integration Test", "Test message"
        )

        assert result is True
        mock_prepare_email.assert_called_once_with("Test message")

        # Verify the prepared template was used
        call_args = mock_server.sendmail.call_args[0]
        sent_message = call_args[2]
        assert "Welcome!" in sent_message

    @patch("app.utils.email.create_transport")
    def test_email_error_handling_chain(self, mock_create_transport):
        """Test error handling across different email functions."""
        # Test SMTP exception handling
        mock_server = Mock()
        mock_server.sendmail.side_effect = smtplib.SMTPException("Server error")
        mock_create_transport.return_value.__enter__.return_value = mock_server

        # Text email should handle SMTP exception
        text_result = send_text_email("error@example.com", "Error Test", "Message")
        assert text_result is False

        # HTML email should handle SMTP exception
        html_result = send_html_email("error@example.com", "Error Test", "Message")
        assert html_result is False

    @patch("app.utils.email.create_transport")
    def test_bulk_email_partial_failure(self, mock_create_transport):
        """Test bulk email with some failures."""
        mock_server = Mock()

        # First call succeeds, second fails, third succeeds
        mock_server.sendmail.side_effect = [
            None,  # Success
            Exception("Temporary failure"),  # Failure
            None,  # Success
        ]

        mock_create_transport.return_value.__enter__.return_value = mock_server

        recipients = [
            "success1@example.com",
            "fail@example.com",
            "success2@example.com",
        ]

        # This should not raise an exception, but continue processing
        send_bulk_emails(recipients, "Bulk Test", "Message")

        # Should attempt to send to all recipients
        assert mock_server.sendmail.call_count == 3

    @patch("app.utils.email.create_transport")
    @patch("builtins.open", new_callable=mock_open, read_data=b"test file content")
    @patch("os.path.basename")
    def test_attachment_email_file_handling(
        self, mock_basename, mock_file, mock_create_transport
    ):
        """Test email attachment file handling."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server
        mock_basename.return_value = "test.txt"

        file_path = "/path/to/test.txt"

        send_email_with_attachment(
            "attachment@example.com",
            "Attachment Test",
            "Message with attachment",
            file_path,
        )

        # Verify file was opened and read
        mock_file.assert_called_once_with(file_path, "rb")
        mock_basename.assert_called_once_with(file_path)
        mock_server.sendmail.assert_called_once()

    @patch("app.utils.email.create_transport")
    def test_email_content_types(self, mock_create_transport):
        """Test different email content types in bulk sending."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        recipients = ["content@example.com"]

        # Test plain text
        send_bulk_emails(recipients, "Plain Subject", "Plain message", is_html=False)

        # Test HTML
        send_bulk_emails(
            recipients, "HTML Subject", "<h1>HTML message</h1>", is_html=True
        )

        # Should have called sendmail twice
        assert mock_server.sendmail.call_count == 2

        # Check content types in sent messages
        calls = mock_server.sendmail.call_args_list
        plain_message = calls[0][0][2]
        html_message = calls[1][0][2]

        assert "Content-Type: text/plain" in plain_message
        assert "Content-Type: text/html" in html_message

    def test_email_message_construction(self):
        """Test email message object construction."""
        # Test MIMEText construction
        message = "Test message content"
        mime_text = MIMEText(message)

        assert str(mime_text) != ""
        assert mime_text.get_content_type() == "text/plain"

        # Test MIMEText HTML construction
        html_message = "<h1>HTML Test</h1>"
        mime_html = MIMEText(html_message, "html")

        assert str(mime_html) != ""
        assert mime_html.get_content_type() == "text/html"

    @patch("app.utils.email.create_transport")
    def test_email_recipient_validation(self, mock_create_transport):
        """Test email sending with various recipient formats."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        # Test different email formats
        test_emails = [
            "simple@example.com",
            "with.dots@example.com",
            "with+plus@example.com",
            "with-dash@example.com",
        ]

        for email in test_emails:
            result = send_text_email(email, "Validation Test", "Message")
            assert result is True

        assert mock_server.sendmail.call_count == len(test_emails)

    @patch("app.utils.email.create_transport")
    def test_email_subject_encoding(self, mock_create_transport):
        """Test email subject with special characters."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server

        # Test subject with special characters
        special_subject = "Test Subject with émojis 🚀 and spëcial chars"

        result = send_text_email("encoding@example.com", special_subject, "Message")

        assert result is True

        # Verify subject was included in message
        call_args = mock_server.sendmail.call_args[0]
        sent_message = call_args[2]
        # Check that the subject is encoded (will contain encoded characters)
        assert "Subject:" in sent_message


@pytest.mark.integration
class TestEmailServiceIntegration:
    """Integration tests for email service functionality."""

    @patch("app.utils.email.create_transport")
    @patch("app.utils.email.prepare_email")
    def test_complete_email_workflow(self, mock_prepare_email, mock_create_transport):
        """Test complete email sending workflow."""
        mock_server = Mock()
        mock_create_transport.return_value.__enter__.return_value = mock_server
        mock_prepare_email.return_value = "<html><body>Workflow test</body></html>"

        # Step 1: Send HTML email
        html_result = send_html_email(
            "workflow@example.com", "Workflow Test", "HTML content"
        )
        assert html_result is True

        # Step 2: Send text email
        text_result = send_text_email(
            "workflow@example.com", "Workflow Text", "Text content"
        )
        assert text_result is True

        # Step 3: Send bulk emails
        send_bulk_emails(
            ["bulk1@example.com", "bulk2@example.com"], "Bulk", "Bulk content"
        )

        # Verify all emails were sent
        assert mock_server.sendmail.call_count == 4  # 1 HTML + 1 text + 2 bulk

    @patch("app.utils.email.create_transport")
    def test_email_error_recovery(self, mock_create_transport):
        """Test email service error recovery."""
        mock_server = Mock()

        # First call fails, second succeeds
        mock_server.sendmail.side_effect = [
            Exception("Temporary failure"),
            None,  # Success
        ]

        mock_create_transport.return_value.__enter__.return_value = mock_server

        # First attempt should fail
        result1 = send_text_email(
            "recovery@example.com", "Recovery Test 1", "Message 1"
        )
        assert result1 is False

        # Second attempt should succeed
        result2 = send_text_email(
            "recovery@example.com", "Recovery Test 2", "Message 2"
        )
        assert result2 is True
