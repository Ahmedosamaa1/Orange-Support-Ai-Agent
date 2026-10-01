from typing import Dict, Any, List
from app.schemas import NetworkStatus, Citation

class NetworkService:
    def __init__(self):
        # Realistic network status matrix for key telecom regions
        self.regions_status: Dict[str, Dict[str, Any]] = {
            "cairo": {
                "status": "degraded",
                "affected_services": ["VDSL Central Exchange Port 4B", "Home DSL"],
                "estimated_fix_time": "Today at 23:00 CLT",
                "details": "Scheduled fiber maintenance and MSAN cabinet card upgrade in East Cairo sector."
            },
            "giza": {
                "status": "operational",
                "affected_services": [],
                "estimated_fix_time": None,
                "details": "All central stations, 4G towers, and DSLAM cabinets are operating at 100% nominal capacity."
            },
            "alexandria": {
                "status": "operational",
                "affected_services": [],
                "estimated_fix_time": None,
                "details": "Submarine cable gateway and regional broadband networks normal."
            },
            "mansoura": {
                "status": "outage",
                "affected_services": ["Home DSL", "Fixed Fiber"],
                "estimated_fix_time": "Tomorrow at 06:00 CLT",
                "details": "Civil engineering roadwork caused physical fiber cable cut on El-Gish street. Engineering team dispatched."
            }
        }

    def check_status(self, region: str = "Cairo") -> NetworkStatus:
        """Fetch network health by region."""
        norm_region = region.lower().strip()
        data = self.regions_status.get(norm_region)
        if not data:
            # Default to operational for unspecified regions
            return NetworkStatus(
                region=region.capitalize(),
                status="operational",
                affected_services=[],
                estimated_fix_time=None,
                details=f"All infrastructure in {region.capitalize()} sector is operating normally."
            )
        return NetworkStatus(
            region=region.capitalize(),
            status=data["status"],
            affected_services=data["affected_services"],
            estimated_fix_time=data["estimated_fix_time"],
            details=data["details"]
        )

    def get_citation(self, region: str = "Cairo") -> Citation:
        status_obj = self.check_status(region)
        status_text = f"Status: {status_obj.status.upper()}. Details: {status_obj.details}"
        if status_obj.estimated_fix_time:
            status_text += f" Expected resolution: {status_obj.estimated_fix_time}."
        return Citation(
            source_type="network_api",
            source_title=f"Network Health API: {status_obj.region} Node",
            snippet=status_text,
            confidence=0.99
        )

network_service = NetworkService()
