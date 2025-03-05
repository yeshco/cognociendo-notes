{
  "tags": [],
  "level": "3.b",
  "updated": "2025-03-03T16:23:15.196Z"
}


# DNS record types

When deploying a website you typically use the domain provider to upload your records to the DNS using the IP information provided by your hosting provider, the hosting provider then checks that everything is in order and you're ready to go.
### A
Its the **main** record that links a domain name to the **physical IP** used by your hosting provider
### CNAME
This record points an alias domain name to a canonical **domain name,** this is only allowed for subdomains not apex domains
#### Example
Example for this:

This website has only two DNS records A and CNAME. 

A is used here so the “naked website”; the apex domain can be accessed directly. 

Now because the hosting provider wants to be able to filter requests and process them further any request to the physical IP made by looking at A is immediately rerouted to the subdomain www. 

Here CNAME enters into play and points the request to the hosting domain that will handle the request.

Removing A will make any apex request fail and www would need to be used to access the website. Removing CNAME in this case would make every request fail since CNAME here is the one actually pointing to the hosting domain.
