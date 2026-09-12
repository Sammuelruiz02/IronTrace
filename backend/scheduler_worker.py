from apscheduler.schedulers.blocking import BlockingScheduler

from app.database import SessionLocal
from app.routes import (
    check_for_never_connected_tracker_devices,
    check_for_offline_tracker_devices,
)
from app.user_models import Organization


scheduler = BlockingScheduler()


def run_tracker_health_checks() -> None:
    database = SessionLocal()

    try:
        organization_ids = [
            row[0]
            for row in (
                database.query(
                    Organization.id
                )
                .all()
            )
        ]

        for organization_id in organization_ids:
            check_for_offline_tracker_devices(
                database=database,
                organization_id=organization_id,
                offline_after_minutes=15,
            )

            check_for_never_connected_tracker_devices(
                database=database,
                organization_id=organization_id,
                grace_period_minutes=30,
            )

        database.commit()

    except Exception:
        database.rollback()
        raise

    finally:
        database.close()


scheduler.add_job(
    run_tracker_health_checks,
    trigger="interval",
    minutes=5,
    id="tracker-health-check",
    replace_existing=True,
)


if __name__ == "__main__":
    print("IronTrace scheduler started.")
    scheduler.start()
