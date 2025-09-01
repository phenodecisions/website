<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST["name"]);
    $company = htmlspecialchars($_POST["company"]);
    $email = htmlspecialchars($_POST["email"]);
    $message = htmlspecialchars($_POST["message"]);

    $to = "info@phenodecisions.com"; 
    $subject = "New contact form submission from $name";
    $body = "Name: $name\nCompany: $company\nEmail: $email\n\nMessage:\n$message";

    // Use a domain-based sender to improve deliverability
    $headers = "From: no-reply@phenodecisions.com\r\n";
    $headers .= "Reply-To: $email\r\n";

    if (mail($to, $subject, $body, $headers)) {
        echo "Thank you, your message has been sent!";
    } else {
        echo "Sorry, something went wrong. Please try again.";
    }
}
?>
