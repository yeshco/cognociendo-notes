# DNS record types

When deploying a website you typically use the domain provider to upload your records to the DNS using the IP information provided by your hosting provider, the hosting provider then checks that everything is in order and you're ready to go.
### A
Its the **main** record that links a domain name to the **physical IP** used by your hosting provider
### CNAME
This record points an alias domain name to a canonical **domain name,** this is only allowed for subdomains not apex domains
#### Example
Ok so this is how it works on this specific website for example:
The apex record has to point to a specific physical IP, but what happens when that IP is hit is that its immediately redirected by the hosting provider to a subdomain, in this case www. So another DNS lookup is made there and there the record points to another domain not an actual IP, this allows the hosting provider to process the requests for better protection against attacks or other reasons.



