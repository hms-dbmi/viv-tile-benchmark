
output "http1_id" {
  description = "http1 ID"
  value       = "${module.ec2_http1.id}"
}

output "http1_public_dns" {
  description = "DNS name assigned to the http1 instance"
  value       = "${module.ec2_http1.public_dns}"
}

output "http2_id" {
  description = "http2 ID"
  value       = "${module.ec2_http2.id}"
}

output "http2_public_dns" {
  description = "DNS name assigned to the http2 instance"
  value       = "${module.ec2_http2.public_dns}"
}